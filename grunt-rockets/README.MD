# How to run

I assume you use Linux or Mac OS. If you use Windows, you can use WSL (Windows Subsystem for Linux) or Docker, but the instructions are not provided here.

1. Install Node.js and npm. You can download the installer from the official website: https://nodejs.org/en/download/
2. Enter this folder in the terminal and run `npm ci` to install the dependencies.
3. Run `npm run build`
4. Run `npm run get-gamemaster` to download the latest Game Master file (it will be saved in `/tmp` folder and will be lost on PC restart).
5. Run `npm run generate-artifacts` to generate the artifacts (Markdown files).
