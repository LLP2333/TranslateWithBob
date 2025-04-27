package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
)

// 控制是否开启日志的常量
const enableLogging = false

// 日志文件路径
const logFilePath = "/Users/llp/translateServer/log"

func init() {
	// 配置日志
	if enableLogging {
		logFile, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			log.Fatal("无法打开日志文件:", err)
		}
		log.SetOutput(logFile)
		log.SetFlags(log.Ldate | log.Ltime)
	} else {
		// 禁用日志
		log.SetOutput(io.Discard)
	}
}

func escapeText(text string) string {
	// 转义文本中的特殊字符，防止注入
	bytes, _ := json.Marshal(text)
	escaped := string(bytes)
	return escaped[1 : len(escaped)-1] // 去掉首尾的引号
}

func translateWithBob(text string) {
	if enableLogging {
		log.Printf("收到翻译请求: %s", text)
	}
	escapedText := escapeText(text)

	var logRedirect string
	if enableLogging {
		logRedirect = " >> " + logFilePath + " 2>&1"
	} else {
		logRedirect = " > /dev/null 2>&1"
	}

	script := fmt.Sprintf(`osascript -l JavaScript -e '
		const bob = Application("com.hezongyidev.Bob");
		bob.request(JSON.stringify({
			"path": "translate",
			"body": {
				"action": "translateText", 
				"text": "%s",
			}
		}));'%s
	`, escapedText, logRedirect)

	cmd := exec.Command("bash", "-c", script)
	err := cmd.Run()
	if err != nil && enableLogging {
		log.Printf("调用Bob时出错: %v", err)
	}
	if enableLogging {
		log.Printf("翻译请求已发送到Bob")
	}
}

func getMessage() ([]byte, error) {
	// 读取消息长度 (4字节)
	var length uint32
	if err := binary.Read(os.Stdin, binary.LittleEndian, &length); err != nil {
		if err == io.EOF {
			return nil, io.EOF
		}
		return nil, err
	}

	// 读取消息内容
	message := make([]byte, length)
	if _, err := io.ReadFull(os.Stdin, message); err != nil {
		return nil, err
	}

	return message, nil
}

func main() {
	for {
		message, err := getMessage()
		if err != nil {
			if err == io.EOF {
				if enableLogging {
					log.Printf("输入流已关闭，程序退出")
				}
				os.Exit(0)
			}
			if enableLogging {
				log.Printf("读取消息时出错: %v", err)
			}
			continue
		}

		// 解析消息
		var receivedText string
		if err := json.Unmarshal(message, &receivedText); err != nil {
			if enableLogging {
				log.Printf("解析消息时出错: %v", err)
			}
			continue
		}

		// 调用Bob翻译
		translateWithBob(receivedText)
	}
}
