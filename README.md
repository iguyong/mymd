# mymd
My markdown parser

First, implement features of hackmd.io, excluding:
- continue line number of code block
- blockquote tags
- flow, mermaid, viz, sequence, abc

command:
```bash
mymd -ft <input_path> <output_path>
```
- -t: for test, no converting and writing
- -f: force, convert and write even already exists