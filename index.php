<?php
// This file is provided as a potential fallback for some hosting configurations.
// In most cases with Hostinger's Node.js setup, the .htaccess file is all you need,
// and this index.php file can be deleted from your public_html directory.

// It simply redirects the root path to ensure routing is handled by Next.js.
header("Location: /");
exit();
?>
