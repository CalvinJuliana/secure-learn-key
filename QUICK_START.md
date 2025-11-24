# Quick Start Guide

## 🚀 快速推送代码到 GitHub

### 方法 1: 使用脚本（推荐）

```powershell
# 在项目根目录运行
.\git-push.ps1

# 或使用自定义提交信息
.\git-push.ps1 -Message "修复了某个bug"
```

### 方法 2: 手动命令

```powershell
git add .
git commit -m "你的提交信息"
git push origin main
```

## 📋 日常开发流程

1. **修改代码**
2. **检查更改**
   ```powershell
   git status
   ```
3. **提交并推送**
   ```powershell
   .\git-push.ps1
   ```

## ⚠️ 重要提示

- ✅ **会自动忽略的文件**（不会上传）:
  - `.env.local` - 环境变量
  - `node_modules/` - 依赖包
  - `artifacts/`, `cache/` - 构建文件
  - `types/` - 类型定义（会自动生成）

- ❌ **不要提交**:
  - 个人访问令牌 (Personal Access Token)
  - 私钥文件
  - 敏感配置信息

## 🔗 仓库信息

- **GitHub 地址**: https://github.com/CalvinJuliana/secure-learn-key
- **分支**: main
- **远程仓库已配置**: ✅

## 📝 提交信息规范

建议使用清晰的提交信息：

```
功能: 添加新功能
修复: 修复bug
更新: 更新依赖或配置
文档: 更新文档
重构: 代码重构
```

示例：
- `功能: 添加学习进度解密功能`
- `修复: 解决合约编译错误`
- `更新: 更新README文档`

