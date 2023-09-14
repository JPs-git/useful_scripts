const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const hostsFilePath = process.platform === 'win32' ? 'C:/Windows/System32/drivers/etc/hosts' : '/etc/hosts';
const backupFilePath = process.platform === 'win32' ? 'C:/Windows/System32/drivers/etc/hosts.backup' : '/etc/hosts.backup';

// 根据参数判断是否需要恢复备份的 hosts 文件
const shouldReset = process.argv.includes('--reset');
if (shouldReset) {
  // 恢复备份的 hosts 文件
  fs.copyFile(backupFilePath, hostsFilePath, (err) => {
    if (err) {
      console.error('无法恢复备份的 hosts 文件:', err);
      process.exit(1);
    }
    console.log('已恢复备份的 hosts 文件');

    // 输出当前 hosts 文件内容
    console.log('当前的 hosts 文件内容为：');
    fs.readFile(hostsFilePath, 'utf8', (err, content) => {
      if (err) {
        console.error('无法读取 hosts 文件:', err);
        process.exit(1);
      }
      console.log(content);
      process.exit(0);
    });
  });
} else {
  // 备份 hosts 文件
  fs.copyFile(hostsFilePath, backupFilePath, (err) => {
    if (err) {
      console.error('无法备份 hosts 文件:', err);
      process.exit(1);
    }
    console.log('已备份 hosts 文件');

    // 读取 hosts 文件内容
    fs.readFile(hostsFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('无法读取 hosts 文件:', err);
        process.exit(1);
      }

      rl.question('请输入要修改的 IP 地址: ', (ip) => {
        // 将输入的 IP 地址与 "github.com" 组合
        const lineToReplace = `${ip} github.com`;

        // 在 hosts 文件中查找并替换包含 "github.com" 的行
        const updatedContent = data.replace(/.*github\.com.*/g, lineToReplace);

        // 写入更新后的内容到 hosts 文件
        fs.writeFile(hostsFilePath, updatedContent, 'utf8', (err) => {
          if (err) {
            console.error('无法写入 hosts 文件:', err);
            process.exit(1);
          }

          // 刷新 DNS 缓存
          const flushCacheCommand = process.platform === 'win32' ? 'ipconfig /flushdns' : 'sudo dscacheutil -flushcache';
          exec(flushCacheCommand, (err, stdout, stderr) => {
            if (err) {
              console.error('刷新 DNS 缓存失败:', err);
              process.exit(1);
            }

            console.log('Hosts 文件已成功更新并刷新 DNS 缓存');

            // 输出当前 hosts 文件内容
            console.log('当前的 hosts 文件内容为：');
            fs.readFile(hostsFilePath, 'utf8', (err, content) => {
              if (err) {
                console.error('无法读取 hosts 文件:', err);
                process.exit(1);
              }
              console.log(content);
              process.exit(0);
            });
          });
        });
      });
    });
  });
}
