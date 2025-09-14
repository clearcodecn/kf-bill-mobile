# KF Bill Mobile Makefile
# 用于构建不同环境的移动端卡密管理系统

.PHONY: help c1 c2 clean install dev

# 默认目标
help:
	@echo "KF Bill Mobile 构建工具"
	@echo ""
	@echo "可用命令:"
	@echo "  make c1     - 构建c1环境"
	@echo "  make c2     - 构建c2环境"
	@echo "  make dev    - 启动开发服务器"
	@echo "  make install - 安装依赖"
	@echo "  make clean  - 清理构建文件"
	@echo "  make help   - 显示此帮助信息"

# 构建c1环境
c3:
	@echo "🚀 开始构建c1环境..."
	@if [ ! -f .env.c3 ]; then \
		echo "❌ 错误: .env.c3 文件不存在"; \
		exit 1; \
	fi
	@cp .env.c3 .env
	@pnpm run build
	@echo "✅ c1环境构建完成！"

# 构建c2环境
c4:
	@echo "🚀 开始构建c2环境..."
	@if [ ! -f .env.c4 ]; then \
		echo "❌ 错误: .env.c4 文件不存在"; \
		exit 1; \
	fi
	@cp .env.c4 .env
	@pnpm run build
	@echo "✅ c2环境构建完成！"

# 启动开发服务器
dev:
	@echo "🚀 启动开发服务器..."
	@pnpm run dev

# 安装依赖
install:
	@echo "📦 安装项目依赖..."
	@pnpm install

# 清理构建文件
clean:
	@echo "🧹 清理构建文件..."
	@rm -rf dist
	@rm -f .env
	@echo "✅ 清理完成！"
