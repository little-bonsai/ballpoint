# Ink Prettier Plugin

> An [prettier] plugin for formatting [ink]

**⚠️PLEASE NOTE THIS TOOL IS STILL WORK IN PROGRESS⚠️**

**⚠️SAVE YOUR WORK BEFORE FORMATTING IT⚠️**

## Get Started

### Step 1 Install node.js

use [nvm] to install node

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install 18
nvm use 18
```

### Step 2 Install Prettier & Prettier-Plugin-Ink

```bash
npm install -g prettier prettier-plugin-ink
```

### Step 3 Run

> Make sure you save your work first! This will overwrite your files!

```bash
prettier -w **/*.ink
```

## Ignore

Writing `//prettier-ignore` will cause the following lines to be ignored by prettier. It will ignore **All the following lines of the same depth**, eg:

```ink

=== knot
//prettier-ignore
****** this line WILL not be formatted
****** this line WILL ALSO not be formatted

=== knot
*** this line WILL be formatted
```

Only `//` style comments are currently supported

## Contributing

Bug Reports and PRs are very welcome.

If filing a bug report, please include:

- your original ink code
- how it was formatted
- how it should be formatted
- any additional information

If opening a MR, please include:

- a description of the change
- at least 1 test showing the input and output

## TODO

- [x] npm publish
- [x] INCLUDE handling
- [x] repeated application test
- [x] tags
- [x] prettier-ignore pragma
- [x] multiple tags
- [ ] web hosted
- [ ] dynamic tags
- [ ] proper comment handling
- [ ] prettier-ignore multi-line comments
- [ ] sort INCLUDEs option
- [ ] api?

[prettier]: https://prettier.io/
[ink]: https://github.com/inkle/ink/
[nvm]: https://github.com/nvm-sh/nvm
