# Mindmap Extension

Mindmap is a browser extension that visualizes your browsing sessions as an interactive, time-based graph. It helps you track your research trails, understand your navigation history, and manage complex browsing contexts by displaying pages as nodes and navigation paths as edges.

Currently only for Firefox.


## Features

- **Automatic Session Tracking**: Records page visits, titles, and favicons in the background.
- **Interactive Visualization**: Uses [Cytoscape.js](https://js.cytoscape.org/) to render a dynamic graph of your browsing history.
- **Smart Layout Algorithm**:
  - **Time-based Positioning**: Nodes are spaced horizontally based on the time elapsed between visits.
  - **Branching Lanes**: New tabs and child pages create visual branches (lanes) to represent context switching.
- **Context Awareness**: Tracks tab openers to correctly link pages (e.g., opening a link in a new tab connects it to the source page).
- **Session Management**:
  - Export sessions to JSON.
  - Import previous sessions to resume analysis.
- **Zoom Levels**: Semantic zoom (Overview, Normal, Detail) that adjusts the density of the graph based on the viewport.

## Installation

### Prerequisites

- Node.js and npm

### Build Steps

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
   This will generate the production files in the `dist/` directory using Vite.
   Alternatively, use build.ps1 for powershell

### Loading the Extension

1. Open your browser's extension management page:
   - **Firefox**: `about:debugging`
2. Enable **Developer Mode**.
3. Click **"Load Temporary Add-on**
4. Select the `manifest.json` file.
5. It should now show up as an extension

## Usage

1. **Start Browsing**: The extension automatically tracks navigation events.
2. **Open Viewer**: Click the extension icon in the browser toolbar. This opens the Mindmap Viewer in a new tab.
3. **Interact with Graph**:
   - **Pan/Zoom**: Use mouse drag and scroll to navigate the timeline.
   - **Hover**: Hover over nodes to highlight the domain and specific URL paths.
   - **Context Menu**: Right-click nodes to inspect details.
4. **Export/Import**: Use the buttons in the viewer interface to save or load session data.

## Project Structure

- **`src/background.js`**: Service worker that handles event listeners (navigation, tab updates) and stores data in `browser.storage.local`.
- **`src/viewer/`**: Contains the logic for the visualization frontend.
  - **`viewer.js`**: Main entry point that initializes Cytoscape and handles user interactions.
  - **`layout.js`**: Custom layout logic for computing node coordinates (`x` by time, `y` by lane).
- **`src/utils.js`**: Shared utility functions for URL parsing and data handling.

## License

MIT

