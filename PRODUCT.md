# Formatter Workbench

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
User-specified HTML, CSS, and JavaScript in `./formatter`. Native ES modules and Web Workers run without a framework. Cloudflare Pages serves static assets. Vendored Prettier, its XML plugin, and SQL Formatter provide parser-based formatting.

## Product Purpose
Select a code/data format, edit code in one editor, and select Format to replace its contents with a readable result without sending input to a server. English UI and privacy copy follow the user's choices for the related Base64 utility.

## Capabilities and Constraints
Twelve formats; indentation, width and newline controls; per-format options; examples, file upload, copy and download of the current editor contents. Inputs are limited to 1 MiB. Formatting runs only when Format, Compact JSON, or the keyboard shortcut is used. Errors leave the editor unchanged. Formatting never executes code or stores input. All fonts and libraries are hosted locally.

## Open Decisions
No new audience or branding requirements were supplied. The visual system inherits Base64; this is an implementation choice.
