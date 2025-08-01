
'use server';
/**
 * @fileOverview A conversational AI assistant for PlotPilot, tailored for the Pakistani real estate market.
 *
 * - chatWithAssistant - A function to interact with the AI assistant.
 * - ChatAssistantInput - The input type for the chatWithAssistant function.
 * - ChatAssistantOutput - The return type for the chatWithAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { 
    addProperty, 
    getProperties,
    getPropertyById,
    getPropertyByName,
    updateProperty,
} from '@/lib/mock-db';
import type { Property } from '@/types';

const addBusinessTaskTool = ai.defineTool(
  {
    name: 'addBusinessTask',
    description: 'Adds a new task to the business to-do list or captures a reminder. Use this when the user explicitly asks to create a task, note, or reminder.',
    inputSchema: z.object({
      taskDescription: z.string().describe('A detailed description of the task to be added.'),
    }),
    outputSchema: z.string().describe('Confirmation message after attempting to add the task.'),
  },
  async ({taskDescription}) => {
    console.log(`AI Task Added via Tool: ${taskDescription}`);
    return `Okay, I've noted down the task: "${taskDescription}". You can find it in your task list.`;
  }
);

const ListPropertiesInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose properties are being requested."),
  filter: z.string().optional().describe("Optional filter criteria, e.g., 'available', 'sold', 'rented', or by property type like 'house', 'plot'."),
  location: z.string().optional().describe("Optional location filter, e.g., 'DHA Lahore', 'Bahria Town Karachi'."),
});
const ListPropertiesOutputSchema = z.object({
  properties: z.array(z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    propertyType: z.string().optional(),
    status: z.string().optional(),
  })).describe("List of properties with their basic details including type and status."),
  summary: z.string().describe("A human-readable summary of the properties found."),
});

const listPropertiesTool = ai.defineTool(
  {
    name: 'listProperties',
    description: 'Retrieves a list of properties from the system. Can be filtered by status (e.g., "available", "sold", "rented"), property type (e.g., "house", "plot", "apartment", "file"), or location.',
    inputSchema: ListPropertiesInputSchema,
    outputSchema: ListPropertiesOutputSchema,
  },
  async (input) => {
    let allProperties = await getProperties(input.userId);
    
    if (input.location) {
        allProperties = allProperties.filter(p => p.address.toLowerCase().includes(input.location!.toLowerCase()));
    }

    if (input.filter) {
        const filterLower = input.filter.toLowerCase();
        if (filterLower === 'sold') {
            allProperties = allProperties.filter(p => p.isSoldOnInstallment || p.isSold); 
        } else if (filterLower === 'available') {
            allProperties = allProperties.filter(p => !p.isSoldOnInstallment && !p.isRented && !p.isSold);
        } else if (filterLower === 'rented') {
            allProperties = allProperties.filter(p => p.isRented);
        } else { 
            allProperties = allProperties.filter(p => p.propertyType?.toLowerCase().includes(filterLower));
        }
    }

    const propertyList = allProperties.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      propertyType: p.propertyType || "N/A",
      status: p.isSold ? "Sold" : (p.isSoldOnInstallment ? "Sold (Installment)" : (p.isRented ? "Rented" : "Available")),
    }));

    if (propertyList.length === 0) {
      return { properties: [], summary: "No properties found matching your criteria." };
    }
    const summary = `Found ${propertyList.length} properties. ${propertyList.map(p=>`${p.name} (${p.propertyType})`).join(', ')}.`;
    return { properties: propertyList, summary };
  }
);

const AddPropertyInputSchema = z.object({
  userId: z.string().describe("The ID of the user adding the property."),
  name: z.string().describe('The name of the new property (e.g., "Shadman House", "DHA Phase 5 Plot").'),
  address: z.string().describe('The full address of the new property, including society, block, city if possible.'),
  propertyType: z.string().optional().describe('Type of property, e.g., "Residential Plot", "Commercial Plot", "House", "File", "Shop", "Apartment".'),
});
const AddPropertyOutputSchema = z.object({
  propertyId: z.string().describe('The ID of the newly created property.'),
  message: z.string().describe('Confirmation message.'),
});

const addPropertyTool = ai.defineTool(
  {
    name: 'addProperty',
    description: 'Adds a new property to the system. Requires property name and address. Optionally, property type can be specified.',
    inputSchema: AddPropertyInputSchema,
    outputSchema: AddPropertyOutputSchema,
  },
  async (input) => {
    const newPropertyData: Omit<Property, 'id' | 'createdAt'> = {
        userId: input.userId,
        name: input.name,
        address: input.address,
        propertyType: input.propertyType,
        plots: [],
        isRented: false,
        isSoldOnInstallment: false,
        isSold: false
    };
    const createdProperty = await addProperty(newPropertyData);
    return {
      propertyId: createdProperty.id,
      message: `Successfully added property "${createdProperty.name}" (${createdProperty.propertyType || 'Type N/A'}) with ID ${createdProperty.id}. You can add more details like images or plots via the Properties page.`,
    };
  }
);

const GetPropertyDetailsInputSchema = z.object({
    userId: z.string().describe("The ID of the user whose property is being requested."),
    identifier: z.string().describe('The ID or exact name of the property to retrieve details for.'),
    identifierType: z.enum(['id', 'name']).describe("Specify if the identifier is a property ID or name."),
});
const GetPropertyDetailsOutputSchema = z.object({
    property: z.custom<Property | null>().describe('The full details of the property, or null if not found.'),
    message: z.string().describe('A summary message about the result.'),
});

const getPropertyDetailsTool = ai.defineTool(
    {
        name: 'getPropertyDetails',
        description: "Retrieves detailed information for a specific property using its ID or name. Prefer using ID if known.",
        inputSchema: GetPropertyDetailsInputSchema,
        outputSchema: GetPropertyDetailsOutputSchema,
    },
    async ({ identifier, identifierType, userId }) => {
        let property: Property | undefined | null = null;
        if (identifierType === 'id') {
            const fetchedProperty = await getPropertyById(identifier);
            // Security check: ensure the fetched property belongs to the requesting user.
            if (fetchedProperty && fetchedProperty.userId === userId) {
                property = fetchedProperty;
            }
        } else {
            property = await getPropertyByName(identifier, userId);
        }

        if (property) {
            return { property, message: `Details for property "${property.name}" (ID: ${property.id}): Address: ${property.address}, Type: ${property.propertyType || 'N/A'}.` };
        } else {
            return { property: null, message: `Sorry, I couldn't find a property with ${identifierType} "${identifier}".` };
        }
    }
);

const UpdatePropertyDetailsInputSchema = z.object({
    userId: z.string().describe("The ID of the user whose property is being updated."),
    propertyId: z.string().describe("The ID of the property to update. This is mandatory."),
    updates: z.record(z.any()).describe("An object containing the fields to update, e.g., { name: 'New Name', isRented: true }"),
});
const UpdatePropertyDetailsOutputSchema = z.object({
    updatedProperty: z.custom<Property | null>().describe('The updated property details, or null if update failed.'),
    message: z.string().describe('Confirmation or error message.'),
});

const updatePropertyDetailsTool = ai.defineTool(
    {
        name: 'updatePropertyDetails',
        description: 'Updates specific details (name, address, type, rented status, sold status) of an existing property identified by its ID.',
        inputSchema: UpdatePropertyDetailsInputSchema,
        outputSchema: UpdatePropertyDetailsOutputSchema,
    },
    async (input) => {
        const { propertyId, updates, userId } = input;
        if (Object.keys(updates).length === 0) {
            return { updatedProperty: null, message: "No updates provided. Please specify what you want to change." };
        }

        // Security check before updating
        const propertyToUpdate = await getPropertyById(propertyId);
        if (!propertyToUpdate || propertyToUpdate.userId !== userId) {
            return { updatedProperty: null, message: `Failed to update property. Permission denied or property not found.` };
        }

        const updatedProperty = await updateProperty(propertyId, updates as Partial<Property>);
        if (updatedProperty) {
            return { updatedProperty, message: `Successfully updated property ID ${propertyId}.` };
        } else {
            return { updatedProperty: null, message: `Failed to update property ID ${propertyId}. Please ensure the ID is correct.` };
        }
    }
);


const ChatAssistantInputSchema = z.object({
  userMessage: z.string().describe('The message sent by the user to the AI assistant.'),
  userId: z.string().describe('The unique ID of the user who is interacting with the assistant.'),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  assistantResponse: z.string().describe('The response generated by the AI assistant.'),
  audioDataUri: z.string().optional().describe('A data URI for the assistant\'s spoken response in WAV format.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

export async function chatWithAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  return chatAssistantFlow(input);
}

const assistantPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  input: {schema: ChatAssistantInputSchema},
  output: {schema: z.object({assistantResponse: z.string()})},
  tools: [addBusinessTaskTool, listPropertiesTool, addPropertyTool, getPropertyDetailsTool, updatePropertyDetailsTool], 
  prompt: `You are PlotPilot AI, a friendly and highly intelligent business growth assistant specializing in the Pakistani real estate market.
Your goal is to help users grow their business, manage properties efficiently, and streamline operations by using the data in their account.
The user's ID is {{{userId}}}. You MUST pass this ID to any tool that requires it.
Understand common Pakistani real estate terms like 'Marla', 'Kanal', 'File', 'Society', 'Bayana' (token money), 'Possession', etc. Currency is in PKR.
If the user speaks in Urdu, you must respond in Urdu.

Capabilities:
- Provide business growth ideas and marketing strategies relevant to the Pakistani market, using the user's property and sales data to inform your advice.
- Help draft communications (e.g., tenant notices, marketing copy for local audiences, offer messages for clients based on their details).
- If the user asks you to create a task, reminder, or to-do item, use the 'addBusinessTask' tool.
- Use the 'listProperties' tool to search for or list properties.
- Use the 'addProperty' tool to create a new property.
- Use the 'getPropertyDetails' tool to fetch information about a specific property.
- Use the 'updatePropertyDetails' tool to modify an existing property.
- Do not confirm if you will use a tool, just use it if it's the best way to answer the user's request.
- After using a tool, provide a concise confirmation of the action taken and include key details from the tool's output. For example, if a property is added, mention its name and ID.

User Message: {{{userMessage}}}

Assistant Response:
`,
  config: { 
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ]
  }
});


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatAssistantInputSchema,
    outputSchema: ChatAssistantOutputSchema,
  },
  async (input) => {
    let assistantResponse = "I'm sorry, an error occurred. Please try rephrasing your request.";
    let audioDataUri: string | undefined = undefined;

    try {
      const {output} = await assistantPrompt(input);
      if (output?.assistantResponse) {
        assistantResponse = output.assistantResponse;

        // TTS generation
        try {
          const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Algenib' },
                },
              },
            },
            prompt: assistantResponse,
          });

          if (media) {
            const audioBuffer = Buffer.from(
              media.url.substring(media.url.indexOf(',') + 1),
              'base64'
            );
            const wavBase64 = await toWav(audioBuffer);
            audioDataUri = `data:audio/wav;base64,${wavBase64}`;
          }
        } catch (ttsError) {
          console.error("TTS generation failed:", ttsError);
          // Don't fail the whole flow, just proceed without audio
        }
      }
    } catch (e) {
      console.error("Genkit error in chat flow:", e);
    }
    
    return { assistantResponse, audioDataUri };
  }
);
