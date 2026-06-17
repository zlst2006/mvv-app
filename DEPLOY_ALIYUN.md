# 阿里云部署指南 — 智联数通 MVV 共创小程序

> 只需一台阿里云服务器 + 5分钟，即可完成后端部署。

---

## 📦 部署架构

```
用户手机 → 微信小程序 → 阿里云后端(:3000) → Supabase云数据库
                ↕
         微信开发者工具(上传代码)
```

- **前端**（微信小程序）：本地 `pnpm build:weapp` → 微信开发者工具上传
- **后端**（NestJS）：部署到阿里云服务器，Docker 运行
- **数据库**：使用现有 Supabase 云数据库（无需迁移）

---

## 🚀 快速部署（推荐：Docker + 一键脚本）

### 第1步：购买阿里云服务器

推荐 **轻量应用服务器**（最简单、性价比高）：

| 配置 | 价格 | 适用 |
|------|------|------|
| 1核2G | ~¥34/月 | 够用 |
| 2核4G | ~¥60/月 | 推荐 |

购买链接：https://swas.console.aliyun.com

**选购要点**：
- 镜像选择 **Ubuntu 22.04** 或 **Docker 镜像**
- 地域选择离你最近的城市
- 购买后记下 **公网IP**

### 第2步：安全组开放端口

登录阿里云控制台 → 找到服务器 → **安全组/防火墙** → 添加规则：

| 端口 | 协议 | 用途 |
|------|------|------|
| 3000 | TCP | 后端 API |
| 22   | TCP | SSH（默认已开） |

### 第3步：SSH 连接到服务器

```bash
ssh root@你的服务器IP
```

> Windows 用户可用 [PuTTY](https://www.putty.org/) 或阿里云控制台的"远程连接"

### 第4步：一键部署

连接服务器后，执行以下命令（逐行复制）：

```bash
# 安装 git
apt update && apt install -y git

# 克隆项目
git clone https://github.com/zlst2006/mvv-app.git /opt/mvv-app
cd /opt/mvv-app

# 运行部署脚本（交互式）
bash scripts/deploy.sh
```

脚本会：
1. ✅ 自动安装 Docker 和 Docker Compose
2. ✅ 拉取最新代码
3. ✅ **交互式输入** Supabase 数据库凭据（请从 Supabase 控制台获取）
4. ✅ 构建 Docker 镜像并启动
5. ✅ 验证服务是否正常运行

### 第5步：验证部署

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f mvv-server

# 测试 API
curl http://localhost:3000/api/mvv/users

# 如果是新部署（数据库为空表），也可以从外网测试
curl http://你的服务器IP:3000/api/mvv/users
```

---

## ⚙️ 手动部署（不依赖脚本）

如果不想用交互式脚本，也可以手动操作：

```bash
# 1. 创建配置文件
cd /opt/mvv-app
cat > .env << EOF
COZE_SUPABASE_URL=https://你的项目.supabase.co
COZE_SUPABASE_ANON_KEY=你的anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=你的service-role-key
ADMIN_PASSWORD=adminzlst@2026
EOF

# 2. 构建并启动
docker-compose up -d --build

# 3. 验证
curl http://localhost:3000/api/mvv/users
```

---

## 🛠 日常运维

```bash
# 查看日志
docker-compose logs -f mvv-server

# 重启服务
docker-compose restart mvv-server

# 更新代码（拉取最新版本并重新部署）
cd /opt/mvv-app && git pull && docker-compose up -d --build

# 停止服务
docker-compose down

# 备份数据库（通过 Supabase 控制台导出）
```

---

## 📱 小程序端部署

### 第1步：获取阿里云服务器公网IP

```bash
curl ifconfig.me
```

### 第2步：微信小程序后台配置域名

登录 [微信公众平台](https://mp.weixin.qq.com) → 开发管理 → 开发设置：

| 配置项 | 填写内容 |
|--------|---------|
| request 合法域名 | `http://你的服务器IP:3000` |
|       （建议）   | `https://你的服务器IP:3000`（如有SSL） |

### 第3步：构建小程序代码

```bash
# 在本地开发机执行
cd /workspace/projects
pnpm build:weapp
```

### 第4步：上传代码

用 **微信开发者工具** 打开项目根目录，选择 `dist/` 目录 → 上传代码 → 提交审核。

---

## 🔐 建议（生产环境优化）

**1. 配置 HTTPS（强烈推荐）**
建议使用 Nginx 反代 + Let's Encrypt 免费证书：

```bash
apt install -y nginx certbot python3-certbot-nginx

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/mvv << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/mvv /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 申请 SSL 证书
certbot --nginx -d your-domain.com
```

**2. 配置域名**
- 购买域名（阿里云万网）
- DNS 解析到服务器 IP
- 用域名代替 IP 配置小程序 request 域名

---

## ❓ 常见问题

**Q: 端口 3000 无法访问？**
→ 检查阿里云安全组是否放开 3000 端口
→ 检查服务器防火墙：`ufw status`

**Q: 数据库连接失败？**
→ 检查 `.env` 文件中的 Supabase 凭据是否正确
→ 检查 Supabase 项目是否启用了 Data API

**Q: 如何更新代码？**
```bash
cd /opt/mvv-app && git pull && docker-compose up -d --build
```

**Q: 服务器需要多大配置？**
→ 1核2G 完全够用（50人团队非常轻量）
→ 磁盘 20GB 足够（数据都在 Supabase 云上）