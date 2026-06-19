---
title: 合成器节点组
date: 2025-07-15 20:50:00 +800
parent: Cashew Nodes
nav_order: 3
toc_max_level: 2
---
# 合成器节点组

## 合成器AO

用于还原 EEVEE Legacy 的后期 AO 效果，在视图层打开环境和 AO 通道后连接使用。

### 输入

| 名称 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| **Image** | Color | (1,1,1) | 原始图像输入 |
| **环境** | Color | (0,0,0) | 环境光颜色 |
| **AO** | Color | (1,1,1) | AO 通道输入（视图层开启 AO） |
| **颜色** | Color | (0,0,0) | AO 着色颜色 |
| **From Min** | Float | 0.0 | AO 值映射下限 |
| **From Max** | Float | 1.0 | AO 值映射上限 |

### 输出

| 名称 | 类型 | 说明 |
|---|---|---|
| **Image** | Color | 叠加 AO 后的最终图像 |

### 使用说明

1. 在视图层属性中开启 **环境** 和 **AO** 通道
2. 分别连接 **环境** 和 **AO** Render Layer 输出到对应输入
3. 调整 **颜色** 控制 AO 着色，**From Min/Max** 控制 AO 强度范围

## 辉光(Alpha修复)

Blender 默认 Glare 节点的改进版，新增 Alpha 通道输出，解决原版辉光在 Alpha 通道中丢失辉光信息的问题。

### 输入

| 名称 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| **Image** | Color | (1,1,1) | 输入图像 |
| **Alpha** | Float | 0.0 | Alpha 通道输入 |
| **Fac** | Float (0-1) | 0.25 | 辉光整体强度 |
| **Threshold** | Float | 0.95 | 辉光阈值，高于此值的像素产生辉光 |
| **Smoothness** | Float (0-1) | 0.1 | 阈值边缘平滑度 |
| **Clamp** | Bool | true | 是否钳制辉光值 |
| **Maximum** | Float | 10.0 | 辉光最大值（Clamp 开启时生效） |
| **Strength** | Float (0-1) | 8.0 | 辉光强度（值域 0-1 但默认 8 需注意） |
| **Saturation** | Float (0-1) | 1.0 | 辉光饱和度 |
| **Tint** | Color | (1,1,1) | 辉光染色 |
| **Size** | Float (0-1) | 0.5 | 辉光扩散大小 |

### 输出

| 名称 | 类型 | 说明 |
|---|---|---|
| **混合Alpha输出** | Color | 混合 Alpha 后的图像 |
| **Alpha** | Float | 修复后的 Alpha 通道（含辉光信息） |
| **Image** | Color | 辉光图像（不含 Alpha） |
| **Glare** | Color | 纯辉光层 |
| **Highlights** | Color | 辉光高光选区 |

### 使用说明

配合 **设置Alpha** 节点使用：将 **Alpha** 输出连接到设置Alpha的Alpha输入，将 **混合Alpha输出** 连接到设置Alpha的图像输入。
