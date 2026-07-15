package main

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

// 控制是否开启日志的常量
const enableLogging = false

// 日志文件名，写入用户主目录下
const logFileName = "translate_server.log"

// 单条消息的最大长度，超过则丢弃
const maxMessageSize = 1 << 20 // 1MB

var errMessageTooLarge = errors.New("消息过大")

// 文本通过 argv 传入，无需转义，避免注入和内容被篡改
const jxaScript = `function run(argv) {
	const bob = Application("com.hezongyidev.Bob");
	bob.request(JSON.stringify({
		"path": "translate",
		"body": {
			"action": "translateText",
			"text": argv[0]
		}
	}));
}`

func init() {
	if !enableLogging {
		log.SetOutput(io.Discard)
		return
	}
	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("无法获取用户主目录:", err)
	}
	logFile, err := os.OpenFile(filepath.Join(home, logFileName), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal("无法打开日志文件:", err)
	}
	log.SetOutput(logFile)
	log.SetFlags(log.Ldate | log.Ltime)
}

func translateWithBob(text string) {
	log.Printf("收到翻译请求: %s", text)

	cmd := exec.Command("osascript", "-l", "JavaScript", "-e", jxaScript, text)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("调用Bob时出错: %v, 输出: %s", err, output)
		return
	}
	log.Printf("翻译请求已发送到Bob")
}

func getMessage() ([]byte, error) {
	// 读取消息长度 (4字节)
	var length uint32
	if err := binary.Read(os.Stdin, binary.LittleEndian, &length); err != nil {
		return nil, err
	}

	if length > maxMessageSize {
		// 丢弃消息内容，保持输入流同步
		if _, err := io.CopyN(io.Discard, os.Stdin, int64(length)); err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("%w: %d 字节", errMessageTooLarge, length)
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
			if errors.Is(err, errMessageTooLarge) {
				log.Printf("读取消息时出错: %v", err)
				continue
			}
			// EOF 或流已损坏，退出
			log.Printf("输入流结束: %v", err)
			os.Exit(0)
		}

		// 解析消息
		var receivedText string
		if err := json.Unmarshal(message, &receivedText); err != nil {
			log.Printf("解析消息时出错: %v", err)
			continue
		}

		// 调用Bob翻译
		translateWithBob(receivedText)
	}
}
