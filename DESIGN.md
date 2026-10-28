# Formatter Workbench

The Operate surface inherits the current blog palette in `../blog/app/styles/global.css` and matches Base64: white ground, navy text, blue actions, pale blue surfaces, fine separators and 8px editor corners. Editor headings use the blog’s surface color, and editor bodies use its code background. Self-hosted IBM Plex Sans 5.3.0 supplies UI type, with JetBrains Mono for code. Visible type has a 12px floor. Dark mode follows the system preference using the blog’s deep navy surfaces and light blue accent. Selection, focus, checkboxes and the blue-and-white favicon follow the same palette. Inline SVG symbols provide icons.

| Token | Light | Dark |
| --- | --- | --- |
| Background | `#ffffff` | `#101827` |
| Surface / editor heading | `#edf3fc` | `#16243a` |
| Code background | `#f7f9fd` | `#0d1625` |
| Text | `#182741` | `#e5edf9` |
| Muted text | `#536581` | `#9aacc6` |
| Border | `#dbe4f2` | `#283b58` |
| Accent | `#1d4ed8` | `#91c5fc` |
| Accent surface | `#e6efff` | `#1c3151` |
| Accent hover | `#2563eb` | `#b4d8fd` |
| Text on accent | `#ffffff` | `#101827` |
| Text selection | `#d5e8ff` | `#244e80` |

Format, indentation, line width and newline controls sit above contextual options. One full-width, editable Code panel holds both input and formatted output. Format replaces the editor contents only on success; errors leave the code unchanged. Format and Compact JSON sit in a horizontal action row below the editor, with the shortcut and Clear all alongside. Compact JSON appears only for JSON. Copy and download use the current editor contents, preserving the selected line endings after formatting. Examples and formatted code start at the beginning of the editor.

The user requested a tool-focused surface: format settings begin at the top with 32px desktop and 20px mobile spacing. The site header, display heading, subtitle, and local-processing badge have been removed.

Below 720px, settings form two columns and the action row wraps below the single editor. A persistent notice reads “Your input is not sent to a server.” Focus, errors, loading, empty, disabled and file-drop states are explicit; reduced motion is respected.
