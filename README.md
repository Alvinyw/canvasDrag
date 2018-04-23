# canvasDrag
用 Canvas 实现通过鼠标拖拽改变四边形形状的功能

## 插件用法
```html
<script type="text/javascript" src="jquery.min.js"></script>
<script type="text/javascript" src="canvasDrag.min.js"></script>
<div id="operationPanel"></div>
```
引入上面两个文件之后，即可调用该插件了：
```javascript
$(function () {
    $().canvasDrag(); //不改变默认参数的用法
});
```

## 插件参数配置
```javascript
$().canvasDrag({
	operationPanel: "#operationPanel", //画板的根部容器
	canvasWrapperClass: "canvasDragWrapper", //画板容器
	dragBgContentClass: "dragBgContent", //画板的背景图容器
	canvasEditerClass: "canvasEditer", //Canvas 画板
	defaultPointInfo: 0, //初始角点坐标（为长度为 8 的数组），不能设置成字符串
	dragBgSrc: "", //设置画板的背景图
	canvasWrapperBorder: "1px solid #ddd", //画板容器的边框样式
	brushThickness: 3, //画笔笔触粗细
	defaultLineColor: "#50a8e1", //默认画笔颜色
	errorLineColor: "red", //默认拖拽出不合法四边形时画笔的颜色
	defaultRadiusColor: "#50a8e1", //默认的拖拽点画笔颜色
	errorRadiusColor: "red", //默认拖拽出不合法四边形是拖拽点的颜色
	innerRadiusFillColor: "rgba(255,255,255,.5)", //默认拖拽点内圆的背景色
	vertexOuterRadius: 6, //角点外圆的半径，最小值为（brushThickness+4）
	vertexInnerRadius: 5, //角点内圆的半径，最小值为（brushThickness+3），最大值为（vertexOuterRadius-1）
	midpointOuterRadius: 5, //中点外圆的半径，最小值为（brushThickness+3），最大值为（vertexInnerRadius）
	midpointInnerRadius: 4, //中点内圆的半径，最小值为（brushThickness+2），最大值为（midpointOuterRadius-1）
	mouseX: "#mouseX", //实时显示鼠标在 X 轴的坐标
	mouseY: "#mouseY" //实时显示鼠标在 Y 轴的坐标
});
```
### 参数说明：
- **defaultPointInfo**：为四个角点的坐标，默认值是 0，可设置为长度为 8 的数组，不能设置成字符串；
- **dragBgSrc**：画板背景图的 src；
- **errorLineColor**：拖出不规则四边形时，边框的颜色；
- **errorRadiusColor**：拖出不规则四边形时，八个拖拽点的颜色；
- **innerRadiusFillColor**：八个拖拽点内圆的填充色；

### 概念解释：
- **半径**：圆心到圆边框中心的距离；
- **pointInfo**：四个角点的坐标数组；当 defaultPointInfo 为有效值时，pointInfo = defaultPointInfo；当 defaultPointInfo 为 0 dragBgSrc 为有效值时，pointInfo 等于图片（src 为 dragBgSrc）四个角点的坐标；当 defaultPointInfo 和 dragBgSrc 都为空时，pointInfo 为画板四个角点的坐标；

## 示例

[canvasDrag Demo](https://alvinyw.github.io/Blog/canvasDrag/canvasDrag.html)