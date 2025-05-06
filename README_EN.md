# Translate with Bob

English | [中文](README.md)

A Chrome extension that enables text selection translation by calling Bob translation app.

## Effect

![first](img/first.png)
![second](img/second.png)

## Note
Please ensure Bob translation app is running. Not recommended to place the project in Downloads or Documents directories. Only supports MacOS systems.

## Loading the Extension
Two methods
### Install plug-in from Chrome Web Store [Click to Install](https://chromewebstore.google.com/detail/translate-with-bob/oaknpfbbebnpkhfnckphnenmhnnmaifj)

### Enable Developer Mode in Chrome browser and select the add-on folder

## Ensure Path Exists (Create if Not)
```
ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
```

## Compilation
```bash
cd app
go build -o translate_server main.go
chmod +x translate_server
```

## Configuration
Modify app/translate_server.json file:
- Set `path` to the absolute path of the compiled translate_server
- Update `allowed_origins` according to your Chrome extension ID

Then copy the configuration file to the specified folder:
```bash
cp app/translate_server.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
```

## Additional Info
In app/main.go:
```
enableLogging controls whether logging is enabled
logFilePath controls the log file path
```
Logging is disabled by default. 