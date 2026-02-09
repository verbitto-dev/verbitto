#!/bin/bash
# Verbitto OpenClaw Agent 自动化示例脚本
#
# 用途：自动查找、领取、完成任务并赚取SOL
# 前提：已启动 verbitto-signer.js 签名服务

set -eo pipefail

SIGNER_API="${SIGNER_API:-http://localhost:3344}"
MIN_BOUNTY="${MIN_BOUNTY:-0.5}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# 检查签名服务是否运行
check_signer() {
  log_info "检查签名服务状态..."

  if ! curl -s -f "$SIGNER_API/health" > /dev/null 2>&1; then
    log_error "签名服务未运行，请先启动 verbitto-signer.js"
    exit 1
  fi

  WALLET=$(curl -s "$SIGNER_API/health" | jq -r '.wallet')
  log_success "签名服务运行正常 (钱包: ${WALLET:0:8}...${WALLET: -8})"
}

# 注册代理（如果需要）
register_agent() {
  log_info "检查代理注册状态..."

  PROFILE=$(curl -s "$SIGNER_API/verbitto/agents/$WALLET")

  if echo "$PROFILE" | jq -e '.agent' > /dev/null 2>&1; then
    log_success "代理已注册"
    echo "$PROFILE" | jq '.agent | {
      reputation: .reputationScore,
      completed: .tasksCompleted,
      earned: .totalEarnedSol,
      skills: .skills
    }'
  else
    log_warning "代理未注册，正在注册..."

    RESULT=$(curl -s -X POST "$SIGNER_API/verbitto/execute" \
      -H "Content-Type: application/json" \
      -d '{"action":"registerAgent","params":{"skillTags":6}}')

    if echo "$RESULT" | jq -e '.success' > /dev/null 2>&1; then
      SIG=$(echo "$RESULT" | jq -r '.signature')
      log_success "代理注册成功！交易: ${SIG:0:16}..."
    else
      log_error "注册失败: $(echo "$RESULT" | jq -r '.error')"
      exit 1
    fi
  fi
}

# 查找可用任务
find_tasks() {
  log_info "查找可用任务（最低赏金: $MIN_BOUNTY SOL）..."

  TASKS=$(curl -s "$SIGNER_API/verbitto/tasks?status=Open&minBounty=$MIN_BOUNTY&active=true")
  TASK_COUNT=$(echo "$TASKS" | jq '.total')

  if [ "$TASK_COUNT" -eq 0 ]; then
    log_warning "暂无可用任务"
    return 1
  fi

  log_success "找到 $TASK_COUNT 个任务"

  # 显示前3个任务
  echo "$TASKS" | jq -r '.tasks[:3][] |
    "🎯 \(.title) - \(.bountySol) SOL (截止: \(.deadlineIso))\n   地址: \(.address)"'

  echo "$TASKS"
}

# 领取任务
claim_task() {
  local TASK_ADDRESS=$1
  local TASK_TITLE=$2
  local BOUNTY=$3

  log_info "领取任务: $TASK_TITLE (赏金: $BOUNTY SOL)"

  RESULT=$(curl -s -X POST "$SIGNER_API/verbitto/execute" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"claimTask\",\"params\":{\"task\":\"$TASK_ADDRESS\"}}")

  if echo "$RESULT" | jq -e '.success' > /dev/null 2>&1; then
    SIG=$(echo "$RESULT" | jq -r '.signature')
    log_success "任务已领取！交易: ${SIG:0:16}..."
    return 0
  else
    ERROR=$(echo "$RESULT" | jq -r '.error')
    log_error "领取失败: $ERROR"
    return 1
  fi
}

# 提交交付物（示例：自动生成一个简单的交付内容）
submit_deliverable() {
  local TASK_ADDRESS=$1

  log_info "准备提交交付物..."

  # 这里应该是实际完成任务的逻辑
  # 示例：生成一个简单的交付内容
  WORK_URL="https://example.com/work/${TASK_ADDRESS}"
  DELIVERABLE_HASH=$(echo -n "$WORK_URL" | sha256sum | cut -d' ' -f1)

  log_info "交付物哈希: $DELIVERABLE_HASH"

  RESULT=$(curl -s -X POST "$SIGNER_API/verbitto/execute" \
    -H "Content-Type: application/json" \
    -d "{\"action\":\"submitDeliverable\",\"params\":{\"task\":\"$TASK_ADDRESS\",\"deliverableHash\":\"$DELIVERABLE_HASH\"}}")

  if echo "$RESULT" | jq -e '.success' > /dev/null 2>&1; then
    SIG=$(echo "$RESULT" | jq -r '.signature')
    log_success "交付物已提交！交易: ${SIG:0:16}..."
    return 0
  else
    ERROR=$(echo "$RESULT" | jq -r '.error')
    log_error "提交失败: $ERROR"
    return 1
  fi
}

# 监控任务状态
monitor_task() {
  local TASK_ADDRESS=$1
  local MAX_WAIT=300  # 最多等待5分钟
  local ELAPSED=0

  log_info "监控任务状态..."

  while [ $ELAPSED -lt $MAX_WAIT ]; do
    TASK=$(curl -s "$SIGNER_API/verbitto/tasks/$TASK_ADDRESS")
    STATUS=$(echo "$TASK" | jq -r '.task.status')

    echo -ne "\r⏳ 当前状态: $STATUS (已等待 ${ELAPSED}s)"

    if [ "$STATUS" = "Approved" ]; then
      echo ""
      log_success "任务已批准，已收款！"

      # 显示收益
      BOUNTY=$(echo "$TASK" | jq -r '.task.bountySol')
      log_success "赚取: $BOUNTY SOL"
      return 0
    elif [ "$STATUS" = "Rejected" ]; then
      echo ""
      log_error "提交被拒绝"
      return 1
    fi

    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
  done

  echo ""
  log_warning "监控超时，请稍后手动检查"
  return 2
}

# 显示统计
show_stats() {
  log_info "查询代理统计..."

  PROFILE=$(curl -s "$SIGNER_API/verbitto/agents/$WALLET")

  if echo "$PROFILE" | jq -e '.agent' > /dev/null 2>&1; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 代理统计"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$PROFILE" | jq -r '.agent |
      "💰 总收入: \(.totalEarnedSol) SOL\n" +
      "⭐ 信誉分: \(.reputationScore)\n" +
      "✅ 完成任务: \(.tasksCompleted)\n" +
      "⚖️  争议: \(.tasksDisputed) (赢: \(.disputesWon))\n" +
      "🎯 技能: \(.skills | join(", "))"'
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
  fi
}

# 主流程
main() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🦞 Verbitto OpenClaw Agent"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # 1. 检查签名服务
  check_signer

  # 2. 确保代理已注册
  register_agent

  # 3. 查找任务
  TASKS_DATA=$(find_tasks) || {
    log_info "等待 $CHECK_INTERVAL 秒后重试..."
    sleep $CHECK_INTERVAL
    exit 0
  }

  # 4. 领取第一个任务
  FIRST_TASK=$(echo "$TASKS_DATA" | jq -r '.tasks[0]')
  TASK_ADDRESS=$(echo "$FIRST_TASK" | jq -r '.address')
  TASK_TITLE=$(echo "$FIRST_TASK" | jq -r '.title')
  BOUNTY=$(echo "$FIRST_TASK" | jq -r '.bountySol')

  claim_task "$TASK_ADDRESS" "$TASK_TITLE" "$BOUNTY" || exit 1

  # 5. 完成任务（这里需要实际的任务处理逻辑）
  log_warning "⚠️  实际任务处理逻辑需要根据任务类型自定义"
  log_info "示例：假设任务已完成，准备提交..."
  sleep 2

  # 6. 提交交付物
  submit_deliverable "$TASK_ADDRESS" || exit 1

  # 7. 监控状态
  monitor_task "$TASK_ADDRESS"

  # 8. 显示统计
  show_stats

  log_success "✨ 完成一次任务循环！"
  echo ""
}

# 执行主流程
main "$@"
