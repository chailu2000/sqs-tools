# Development Environment Setup

This guide will help you set up your development environment for the SQS Management Tool using `mise` to manage Java installations.

## Prerequisites

- macOS (you're already on it)
- Terminal access
- Homebrew (if not installed, see below)

## Step 1: Install Homebrew (if needed)

Check if Homebrew is installed:

```bash
brew --version
```

If not installed, install it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Step 2: Install mise

Install mise via Homebrew:

```bash
brew install mise
```

Verify installation:

```bash
mise --version
```

## Step 3: Configure mise in your shell

Add mise to your shell configuration. Since you're using zsh:

```bash
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

Reload your shell configuration:

```bash
source ~/.zshrc
```

Verify mise is activated:

```bash
mise doctor
```

## Step 4: Install Java 21 (LTS)

List available Java versions:

```bash
mise ls-remote java
```

Install Java 21 (Temurin distribution - Eclipse's OpenJDK):

```bash
mise install java@21
```

Set Java 21 as the global default:

```bash
mise use -g java@21
```

Verify Java installation:

```bash
java -version
```

You should see output like:
```
openjdk version "21.0.x" ...
```

Check JAVA_HOME is set:

```bash
echo $JAVA_HOME
```

## Step 5: Install Gradle (for Spring Boot)

Install Gradle using mise:

```bash
mise install gradle@latest
mise use -g gradle@latest
```

Verify Gradle installation:

```bash
gradle --version
```

## Step 6: Install Node.js (for Svelte frontend)

Install Node.js LTS:

```bash
mise install node@lts
mise use -g node@lts
```

Verify Node.js installation:

```bash
node --version
npm --version
```

## Step 7: (Optional) Install pnpm

pnpm is faster than npm for package management:

```bash
mise install pnpm@latest
mise use -g pnpm@latest
```

Verify pnpm:

```bash
pnpm --version
```

## Step 8: Create project-specific configuration

Navigate to your project directory and create a `.mise.toml` file:

```bash
cd /path/to/your/project
```

Create `.mise.toml`:

```toml
[tools]
java = "21"
gradle = "latest"
node = "lts"
pnpm = "latest"
```

This ensures anyone working on the project uses the same tool versions.

Install project tools:

```bash
mise install
```

## Step 9: Verify everything is ready

Run these commands to verify your setup:

```bash
# Check Java
java -version
echo $JAVA_HOME

# Check Gradle
gradle --version

# Check Node.js
node --version
npm --version

# Check pnpm (if installed)
pnpm --version

# Check mise status
mise list
```

## Step 10: IDE Setup (Optional)

### VS Code
If using VS Code, install these extensions:
- Extension Pack for Java (Microsoft)
- Spring Boot Extension Pack (VMware)
- Svelte for VS Code

### IntelliJ IDEA
IntelliJ should automatically detect the Java installation. If not:
1. Go to File → Project Structure → SDKs
2. Add SDK → Add JDK
3. Point to the mise Java installation (usually `~/.local/share/mise/installs/java/21`)

## Troubleshooting

### mise not found after installation
Ensure you've added mise to your shell config and reloaded:
```bash
source ~/.zshrc
```

### Java not found
Check mise installed Java correctly:
```bash
mise list
mise doctor
```

### JAVA_HOME not set
mise should set this automatically. If not, add to `~/.zshrc`:
```bash
export JAVA_HOME=$(mise where java)
```

### Gradle can't find Java
Ensure Java is installed before Gradle:
```bash
mise install java@21
mise install gradle@latest
```

## Quick Reference

### Common mise commands

```bash
# List installed tools
mise list

# List available versions of a tool
mise ls-remote java
mise ls-remote gradle
mise ls-remote node

# Install a specific version
mise install java@21
mise install gradle@8.14
mise install node@20

# Set global default
mise use -g java@21

# Set project-specific version
mise use java@21

# Update all tools
mise upgrade

# Remove a tool version
mise uninstall java@21

# Show current tool versions
mise current
```

## Next Steps

You're now ready to start development! Proceed to:
1. Create the Spring Boot backend project
2. Create the Svelte frontend project
3. Start implementing tasks from `.kiro/specs/sqs-management-tool/tasks.md`

## Alternative: Using SDKMAN! instead of mise

If you prefer SDKMAN! (another popular Java version manager):

```bash
# Install SDKMAN!
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install Java
sdk install java 21-tem

# Install Gradle
sdk install gradle

# Set defaults
sdk default java 21-tem
sdk default gradle
```

However, mise is recommended as it handles multiple languages (Java, Node.js, etc.) in one tool.
