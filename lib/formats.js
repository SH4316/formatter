export const FORMATS = {
  json: { label: 'JSON', extension: 'json', parser: 'json', plugins: ['babel', 'estree'], sample: '{"name":"A little order","version":1,"features":["Readable code","Local formatting"],"settings":{"indent":2,"private":true}}' },
  xml: { label: 'XML', extension: 'xml', parser: 'xml', plugins: ['xml'], sample: '<?xml version="1.0" encoding="UTF-8"?>\n<library><book year="2026" author="Ada"><title>Readable things</title><available/></book><book year="2025" author="Lin"><title>A little order</title></book></library>' },
  html: { label: 'HTML', extension: 'html', parser: 'html', plugins: ['html'], sample: '<!doctype html><html lang="en"><head><title>A little order</title></head><body><main><h1>Hello, world.</h1><p>Make room for readable code.</p></main></body></html>' },
  css: { label: 'CSS', extension: 'css', parser: 'css', plugins: ['postcss'], sample: '.workbench{display:grid;grid-template-columns:1fr 1fr;gap:24px}.editor{color:#245d42;background:white;padding:20px}@media(max-width:720px){.workbench{grid-template-columns:1fr}}' },
  scss: { label: 'SCSS', extension: 'scss', parser: 'scss', plugins: ['postcss'], sample: '$accent:#245d42;.editor{color:$accent;padding:20px;&:focus{outline:2px solid $accent} .title{font-weight:600}}' },
  javascript: { label: 'JavaScript', extension: 'js', parser: 'babel', plugins: ['babel', 'estree'], sample: 'const greet=(name)=>{const message="Hello, "+name;return {message,ready:true}};console.log(greet("world"))' },
  typescript: { label: 'TypeScript', extension: 'ts', parser: 'typescript', plugins: ['typescript', 'estree'], sample: 'interface Project{name:string;ready:boolean}const projects:Project[]=[{name:"Formatter",ready:true}];const names=projects.map((project:Project)=>project.name)' },
  yaml: { label: 'YAML', extension: 'yaml', parser: 'yaml', plugins: ['yaml'], sample: 'name: A little order\nversion: 1\nfeatures: [Readable code, Local formatting]\nsettings: {indent: 2, private: true}\n' },
  markdown: { label: 'Markdown', extension: 'md', parser: 'markdown', plugins: ['markdown'], sample: '# A little order\n\n-   Readable code\n-   Local formatting\n\n| Tool | Purpose |\n|---|---|\n| Formatter | Make code easier to read |\n| Base64 | Encode and decode |\n\nA small tool for the everyday task of turning tangled code into something easier to work with.\n' },
  sql: { label: 'SQL', extension: 'sql', sample: "select p.name,count(t.id) as total from projects p left join tasks t on t.project_id=p.id where p.active=true group by p.name order by total desc;" },
  json5: { label: 'JSON5', extension: 'json5', parser: 'json5', plugins: ['babel', 'estree'], sample: "{ // A more relaxed JSON\nname:'Formatter',version:1,features:['Readable code','Local formatting',],}" },
  graphql: { label: 'GraphQL', extension: 'graphql', parser: 'graphql', plugins: ['graphql'], sample: 'query Projects($limit:Int!){projects(first:$limit){id name tasks{title completed}}}' },
}

export const DEFAULT_OPTIONS = {
  indent: '2', printWidth: 80, endOfLine: 'lf', finalNewline: true,
  singleQuote: false, semi: true, trailingComma: 'all', bracketSpacing: true,
  singleAttributePerLine: false, embedded: false, sortKeys: false,
  xmlWhitespace: 'preserve', xmlQuote: 'preserve', xmlSortAttributes: false, xmlSelfClosingSpace: true,
  htmlWhitespace: 'css', proseWrap: 'preserve', sqlDialect: 'sql', keywordCase: 'upper',
}

export const MAX_INPUT_BYTES = 1024 * 1024
