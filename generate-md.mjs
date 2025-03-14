import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.join(__dirname, '.'); // Adjust to your project's source directory
const OUTPUT_FILE = path.join(__dirname, 'project-files.md');
const EXCLUDE_DIRS = ['node_modules', 'public', '.git', 'dist', 'build'];
const EXCLUDE_EXTENSIONS = ['.svg']; // ✅ Only skipping SVG files
const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit for files to avoid memory issues

// Map file extensions to markdown code block language identifiers
const LANGUAGE_MAP = {
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.json': 'json',
  '.md': 'markdown',
  '.py': 'python',
  '.go': 'go',
  '.java': 'java',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
};

// Function to generate folder structure as a tree
async function generateTree(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let tree = '';

  const filteredEntries = entries
    .filter((entry) => 
      !EXCLUDE_DIRS.includes(entry.name) &&
      !entry.name.startsWith('.') && 
      !EXCLUDE_EXTENSIONS.includes(path.extname(entry.name))
    )
    .sort((a, b) => a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1);

  for (let i = 0; i < filteredEntries.length; i++) {
    const entry = filteredEntries[i];
    const isLast = i === filteredEntries.length - 1;
    const entryPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT_DIR, entryPath);

    tree += `${prefix}${isLast ? '└── ' : '├── '}${entry.name}\n`;

    if (entry.isDirectory()) {
      const subTree = await generateTree(entryPath, `${prefix}${isLast ? '    ' : '│   '}`);
      tree += subTree;
    }
  }

  return tree;
}

// Function to collect all file paths and contents
async function collectFiles(dir, fileList = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT_DIR, entryPath);
    const ext = path.extname(entry.name).toLowerCase();

    if (EXCLUDE_DIRS.includes(entry.name) || entry.name.startsWith('.')) continue;

    if (entry.isFile()) {
      // ✅ Skip SVG files only
      if (EXCLUDE_EXTENSIONS.includes(ext)) continue;

      try {
        const stats = await fs.stat(entryPath);
        if (stats.size > MAX_FILE_SIZE) continue;

        // Determine language for syntax highlighting
        const language = LANGUAGE_MAP[ext] || 'plaintext';
        
        // ✅ Read file content
        const content = await fs.readFile(entryPath, 'utf8');
        
        fileList.push(`### \`${relativePath}\``);
        fileList.push(`\`\`\`${language}`);
        fileList.push(content);
        fileList.push('```');
      } catch (err) {
        fileList.push(`### \`${relativePath}\``);
        fileList.push(`**Error reading file:** ${err.message}`);
      }
    } else if (entry.isDirectory()) {
      await collectFiles(entryPath, fileList);
    }
  }

  return fileList;
}

// Main function to generate the Markdown file
async function generateMarkdown() {
  try {
    console.log('📂 Generating folder structure...');
    const folderStructure = await generateTree(ROOT_DIR);

    console.log('📄 Collecting file paths and contents...');
    const files = await collectFiles(ROOT_DIR);
    const fileList = files.length > 0 ? files.join('\n\n') : '- No files found';

    // Markdown content
    const markdownContent = `
# Project File Structure and List

**Generated on:** ${new Date().toLocaleString()}

## 📂 Folder Structure
\`\`\`
${ROOT_DIR}/
${folderStructure}
\`\`\`

## 📄 File List with Contents

${fileList}
    `.trim();

    // ✅ Write to Markdown file
    await fs.writeFile(OUTPUT_FILE, markdownContent, 'utf8');
    console.log(`✅ Markdown file generated: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error generating Markdown:', error);
  }
}

// ✅ Run the script
generateMarkdown();
