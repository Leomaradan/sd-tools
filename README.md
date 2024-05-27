# SD Tools

## "Here's looking at you, kid." - **Casablanca**

Welcome to the SD Tools, your all-in-one command line interface for interacting with the [AUTOMATIC1111's Stable Diffusion Web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui). This tool brings a robust queue system and a variety of commands to streamline your workflow with Stable Diffusion.

## "May the Force be with you." - **Star Wars**

### Queue System: The Ultimate Power

Our queue system is as versatile as a Jedi Master. With it, you can:

- **Load JSON or JS Files:** Queue your prompts with ease.
- **Control Image Naming:** Take charge of your image names with custom formatting.
- **Extension Management:** Seamlessly handle extensions like ControlNet, Adetailers, MultiDiffusion, Scheduler Assistant, or Cutoff.
- **Basic to Advanced Scripting:** Whether it's simple JSON scripting or full-blown prompt generation scripts, we've got you covered.
- **Permutations Galore:** Generate multiple prompts with a single instruction, multiplying parameters like never before.
- **Cascading Prompts Files:** Share common bases and build upon them effortlessly.
- **Automated Behaviors:** Trigger actions like Adetailers, ControlNet Poses, and Cutoff tokens automatically.
- **And more!:** Maybe I'll document it later.

## "I'll be back." - **The Terminator**

### Additional Commands: More Than Meets the Eye

Our tool offers several powerful commands to enhance your workflow:

- **Rename:** Rename images in bulk using generation parameters and custom rules from JSON.
- **Extract:** Extract prompts from lists of images into text or JSON formats.
- **Upscale:** Upscale images from a directory using ControlNet Tiles or MultiDiffusion.
- **Redraw:** Redraw images from a directory with specific styles using ControlNet ip-adapter or Lineart.

## "To infinity and beyond!" - **Toy Story**

### Getting Started

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Leomaradan/sd-tools
   cd sd-tools
   ```

2. **Ensure nodejs exists (> 18.x):**

   ```bash
   node -v
   ```

3. **Run AUTOMATIC1111 with --api:**
   Windows

   ```bash
   cd <automatic1111 folder>
   webui-user.bat --api
   ```

   Unix

   ```bash
   cd <automatic1111 folder>
   ./webui.sh --api
   ```

4. **Run the Tool:**
   Windows

   ```bash
   ./sd-tools.bat init
   ```

   Unix

   ```bash
   ./sd-tools.sh init
   ```

## "Why so serious?" - **The Dark Knight**

### Usage Examples

- **Queue Command:**

  ```bash
  sd-tools queue your_prompts.json
  ```

  Allowed parameters:

  - **--silent**: Do not display anything in the terminal
  - **--no-log**: Don't log the queries output to a file
  - **--verbose**: Display additional information in the terminal
  - **--simulate**: Run the whole process but don't send the queries to the API
  - **-v, --validate**: Only validate the prompts file

- **Rename Command:**

  ```bash
  sd-tools rename <source> <target>
  ```

  Allowed parameters:

  - **--silent**: Do not display anything in the terminal
  - **--no-log**: Don't log the queries output to a file
  - **--verbose**: Display additional information in the terminal
  - **-c, --config**: Configuration file for renaming images.
  - **-k, --keys**: keys to search for. Allowed formats: "key:value" or "key:value1;value2"
  - **-p, --pattern**: Replace pattern
  - **-t, --test**: Test mode

- **Extract Command:**

  ```bash
  sd-tools extract <source> <format = textbox | json>
  ```

  Allowed parameters:

  - **--silent**: Do not display anything in the terminal
  - **--no-log**: Don't log the queries output to a file
  - **--verbose**: Display additional information in the terminal
  - **-a, --add-before**: Add a string before the extracted text. Use `|` to add multiple texts and generate multiple outputs
  - **-o, --output**: Optional output file. If not provided, the output will be displayed in the terminal
  - **-r, --recursive**: Recursively extract from from sub-directories

- **Upscale Command:**

  ```bash
  sd-tools upscale <source> <style = controlnet | tiled-diffusion>
  ```

  Allowed parameters:

  - **--silent**: Do not display anything in the terminal
  - **--no-log**: Don't log the queries output to a file
  - **--verbose**: Display additional information in the terminal
  - **--simulate**: Run the whole process but don't send the queries to the API
  - **-c, --checkpoint**: Force a specific checkpoint
  - **-d, --denoising**: Denoising factor. If multiple values are provided, the command will generate multiple queries
  - **-t, --recursive**: Recursively upscale images from sub-directories
  - **-x, --upscaling**: Upscaling factor. If multiple values are provided, the command will generate multiple queries

- **Redraw Command:**

  ```bash
  sd-tools redraw <source> <style = realism | anime | both> <method = classical | ip-adapter | both>
  ```

  Allowed parameters:

  - **--silent**: Do not display anything in the terminal
  - **--no-log**: Don't log the queries output to a file
  - **--verbose**: Display additional information in the terminal
  - **--simulate**: Run the whole process but don't send the queries to the API

- **Other Commands:**
  **Init the tools, or force refreshing the cache**

  ```bash
  sd-tools init
  ```

  Allowed parameters:

  - **-e, --endpoint**: Endpoint to use. Default is http://127.0.0.1:7860
  - **-f, --force**: Force reset config
  - **-p, --purge-cache**: Purge the cache

    **Get or set the configs**

  ```bash
  sd-tools config-get <key>
  sd-tools config-set <key> <value>
  ```

  **Running the configuration wizard**

  ```bash
  sd-tools wizard
  ```

## "I'm the king of the world!" - **Titanic**

### Contributing

We welcome contributions from everyone! Whether it's bug fixes, feature additions, or documentation improvements, feel free to submit a pull request.

## "Hasta la vista, baby." - **Terminator 2: Judgment Day**

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## "Houston, we have a problem." - **Apollo 13**

### Troubleshooting

If you encounter any issues, check out our [Wiki](https://github.com/Leomaradan/sd-tools/wiki) or open an [issue](https://github.com/Leomaradan/sd-tools/issues) on GitHub.

Please be aware that this tool is still in development, and some features may not be fully implemented or may change in the future. It works on my PC, bye the way

---

Enjoy your journey with the SD Tools, and remember, the only limit is your imagination!
