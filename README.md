# 启峰创投

启峰创投是面向投资机构、FA、政府招商部门和项目方的创投连接平台。平台提供公开项目市场、四类身份工作台、主体资料审核、项目发布、私有 BP 上传、BP 查看申请与授权，以及运营管理后台。

## 技术栈

- Next.js 16（Webpack）
- React 19
- TypeScript
- Supabase Auth、Postgres、Storage
- Vercel 部署
- 原生 CSS，桌面端与移动端响应式布局

## 本地运行

```bash
npm install
npm run dev
```

打开 <http://127.0.0.1:3000>。

生产构建与启动：

```bash
npm run build
npm run start -- -p 3200
```

没有 Supabase 环境变量时，首页仍可浏览本地展示项目；登录、工作台、项目提交和 BP 存储会显示配置提示，不会伪造登录状态。

## Supabase 配置

1. 在 Supabase 创建项目。
2. 在 SQL Editor 中执行 [`supabase/migrations/20260801000000_initial.sql`](supabase/migrations/20260801000000_initial.sql)。它会创建用户主体、四类角色资料、项目、BP、申请、审核、审计和 RLS，并创建私有 `bp-private` Storage bucket。
3. 在 Supabase Authentication 的 URL Configuration 中设置：
   - Site URL：本地填写 `http://127.0.0.1:3000`，线上填写 Vercel 域名。
   - Redirect URLs：分别加入 `http://127.0.0.1:3000/auth/callback` 和线上域名的 `/auth/callback`。
4. 复制 [`.env.example`](.env.example) 为 `.env.local`，填入 Supabase 项目 URL 和 anon key。
5. 重启开发服务，使用邮箱注册并完成验证。新账号默认处于主体待审核状态，需要管理员审核后才能提交项目或申请查看 BP。

首次配置管理员时，可在 Supabase SQL Editor 中将已注册账号提升为管理员：

```sql
update public.profiles
set role = 'admin',
    admin_role = 'super_admin',
    account_status = 'approved',
    approved_at = timezone('utc', now())
where id = '替换为 auth.users.id';
```

管理员后台地址：`/admin`。Supabase Studio 仍用于底层 Auth、数据库和 Storage 管理；应用后台用于业务审核和操作入口。

## 主要页面

- `/`：公开项目市场与项目详情
- `/about`：平台介绍独立页面
- `/login`：登录、注册、邮箱验证入口和密码重置
- `/profile`：个人与主体资料中心
- `/workspace/investor`：投资机构工作台
- `/workspace/fa`：FA 工作台
- `/workspace/government`：政府招商工作台
- `/workspace/project`：项目方工作台
- `/workspace/project/projects`：项目方项目与 BP 管理
- `/admin`：运营管理后台

## 安全边界

- 一个账号注册后绑定一个平台身份，不能在前台自由切换身份。
- 邮箱验证和主体审核通过后，才开放对应业务权限。
- BP 文件存放在私有 Storage，查看需要有效授权；前端状态不会决定权限。
- Supabase RLS 是最终权限边界，API 只做请求校验和用户体验反馈。
- `SUPABASE_SERVICE_ROLE_KEY` 如未来启用，只能放在服务端环境变量，不能提交仓库或暴露给浏览器。
