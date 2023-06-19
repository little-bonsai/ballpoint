# Ballpoint

> A CLI for formatting [ink] files

Also available in [web app] form

**⚠️PLEASE NOTE THIS TOOL IS STILL WORK IN PROGRESS⚠️**
**It will delete your comments, and fail on INCLUDEs**
**⚠️SAVE YOUR WORK BEFORE FORMATTING IT⚠️**

## Get Started

### Step 1 Install node.js

use [nvm] to install node

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install 18
nvm use 18
```

### Step 2 Ballpoint

```bash
npm install -g @little-bonsai/ballpoint
```

### Step 3 Run

```bash
ballpoint **/*.ink
```

## Acknowledgements

This would not have been possible without the great work of

- [ink]
- [inkjs]

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
- [x] repeated application test
- [x] tags
- [x] multiple tags
- [x] ref arguments
- [x] INCLUDE handling
- [ ] web hosted
  - [x] basic hosting
  - [ ] error reporting
- [ ] comments
- [ ] directives based approach
- [ ] dynamic tags
- [ ] sort INCLUDEs option
- [ ] api?

[prettier]: https://prettier.io/
[ink]: https://github.com/inkle/ink/
[nvm]: https://github.com/nvm-sh/nvm
[inkjs]: https://github.com/y-lohse/inkjs
[web app]: https://bonsai.li/ballpoint
