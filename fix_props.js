const fs = require('fs');
let content = fs.readFileSync('src/components/flows/forms/node-config-form.tsx', 'utf8');

// 1. Pass down availableVars to child forms
content = content.replace(/<SendButtonsForm\s+cfg/g, '<SendButtonsForm availableVars={availableVars} cfg');
content = content.replace(/<SendListForm\s+cfg/g, '<SendListForm availableVars={availableVars} cfg');
content = content.replace(/<SendMediaForm\s+cfg/g, '<SendMediaForm availableVars={availableVars} cfg');

// 2. Add availableVars to component props definition
content = content.replace(/function SendButtonsForm\(\{\s+cfg,\s+allNodes,/g, 'function SendButtonsForm({ availableVars, cfg, allNodes,');
content = content.replace(/function SendListForm\(\{\s+cfg,\s+allNodes,/g, 'function SendListForm({ availableVars, cfg, allNodes,');
content = content.replace(/function SendMediaForm\(\{\s+cfg,\s+allNodes,/g, 'function SendMediaForm({ availableVars, cfg, allNodes,');

// 3. Add availableVars to types
content = content.replace(/cfg: SendButtonsCfg;\s+allNodes: BuilderNode\[\];/g, 'availableVars: string[]; cfg: SendButtonsCfg; allNodes: BuilderNode[];');
content = content.replace(/cfg: SendListCfg;\s+allNodes: BuilderNode\[\];/g, 'availableVars: string[]; cfg: SendListCfg; allNodes: BuilderNode[];');
content = content.replace(/cfg: SendMediaCfg;\s+allNodes: BuilderNode\[\];/g, 'availableVars: string[]; cfg: SendMediaCfg; allNodes: BuilderNode[];');

fs.writeFileSync('src/components/flows/forms/node-config-form.tsx', content);
