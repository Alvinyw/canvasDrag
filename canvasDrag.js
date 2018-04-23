(function ($) {
$.fn.canvasDrag = function (options) {
	/*默认的参数设置*/
	var defaults = {
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
		vertexInnerRadius: 5, //角点内圆半径，最小值为（brushThickness+3），最大值为（vertexOuterRadius-1）
		midpointOuterRadius: 5, //中点外圆的半径，最小值为（brushThickness+3），最大值为（vertexInnerRadius）
		midpointInnerRadius: 4, //中点点内圆半径，最小值为（brushThickness+2），最大值为（midpointOuterRadius-1）
		mouseX: "#mouseX", //实时显示鼠标在 X 轴的坐标
		mouseY: "#mouseY" //实时显示鼠标在 Y 轴的坐标
		
	};
	var settings = $.extend(defaults, options);//把传入的参数 options 合并到 defaults 里并赋给 settings；若 options 里的参数与 defaults 有重复，则 options 会覆盖 defaults 里的参数
	
	//Canvas 画板里的笔触粗细
	var brushThickness = settings.brushThickness;
	
	//计算角点和中点的圆半径
	var vertexOuterRadius = settings.vertexOuterRadius<(brushThickness+4)?(brushThickness+4):settings.vertexOuterRadius,
	    vertexInnerRadius = settings.vertexInnerRadius>(vertexOuterRadius-1)?(vertexOuterRadius-1):(settings.vertexInnerRadius<(brushThickness+3)?(brushThickness+3):settings.vertexInnerRadius),
		midpointOuterRadius = settings.midpointOuterRadius>vertexInnerRadius?vertexInnerRadius:(settings.midpointOuterRadius<(brushThickness+3)?(brushThickness+3):settings.midpointOuterRadius),
		midpointInnerRadius = settings.midpointInnerRadius>(midpointOuterRadius-1)?(midpointOuterRadius-1):(settings.midpointInnerRadius<(brushThickness+2)?(brushThickness+2):settings.midpointInnerRadius);
	
	//初始化 UI
	$(settings.operationPanel).html('<div class="' + settings.canvasWrapperClass + '" oncontextmenu="return false;"><div class="' + settings.dragBgContentClass + '"></div><canvas class="' + settings.canvasEditerClass + '"></canvas></div>');
		
	//初始角点信息
	var pointInfo = new Array(8);
	
	//中点坐标数组
	var midPointInfo = new Array(8);
	
	//判断角点和中点是否能响应拖拽行为的数组
	var pointInductor = new Array(8);
	
	//四边斜率数组
	var slopeSide = new Array(4);
	
	//记录拖拽的四边形是否合法的变量
	var drawErrorRect = false,invalidShape = false;
	
	//当前拖拽的点的 index
	var curDragPointIndex = '';
	
	//当前拖拽点移动前的位置坐标
	var tempX,tempY,tempX0,tempY0,tempX1,tempY1;
	
	var canvasDragWrapper = $(settings.operationPanel + " ." + settings.canvasWrapperClass);
	var dragBgContent = $(settings.operationPanel + " ." + settings.dragBgContentClass);
	var canvasEditer = $(settings.operationPanel + " ." + settings.canvasEditerClass);
	var operationPanelW = $(settings.operationPanel).width(),operationPanelH = $(settings.operationPanel).height();
	
	//外部容器宽高比
	var parentAspectRatio = operationPanelW / operationPanelH;
	
	//初始化主框架样式
	canvasDragWrapper.css({"position":"relative","width":operationPanelW,"height":operationPanelH,"border":settings.canvasWrapperBorder});
	dragBgContent.css({"position":"relative","width":operationPanelW,"height":operationPanelH});
	canvasEditer.css({"position":"absolute","top":0,"left":0,"user-select":"none","-webkit-user-select":"none","-moz-user-select":"none","-ms-user-select":"none"});
	canvasEditer.attr("width",operationPanelW).attr("height",operationPanelH);
	
	if(settings.dragBgSrc!=""){
		//创建新图片
		var dragBgImage = new Image();
		//drag 操作的背景图
		dragBgImage.src = settings.dragBgSrc;
		dragBgImage.onload = function() {
			//等比压缩图片的宽高，使图片上下居中
			var imgAspectRatio = dragBgImage.width / dragBgImage.height;
			$(dragBgImage).css("position","absolute");
			if(imgAspectRatio > parentAspectRatio){
			   dragBgImage.width = operationPanelW;
			   dragBgImage.height = operationPanelW/imgAspectRatio;
			   $(dragBgImage).css({"top":(operationPanelH - dragBgImage.height)/2,"left":0});
			}else {
			   dragBgImage.height = operationPanelH;
			   dragBgImage.width = dragBgImage.height*imgAspectRatio;
			   $(dragBgImage).css({"top":0,"left":(operationPanelW - dragBgImage.width)/2});
			}
			//设置 Canvas 画布的宽高
			canvasEditer.attr("width",dragBgImage.width).attr("height",dragBgImage.height);
			canvasEditer.css({"top":(operationPanelH - dragBgImage.height)/2,"left":(operationPanelW - dragBgImage.width)/2});
			
			//手动设置了有效的 defaultPointInfo
			if(settings.defaultPointInfo.length==8){
				for (var i=0;i < settings.defaultPointInfo.length;i++) {
					pointInfo[i] = settings.defaultPointInfo[i];
				}
			}else{
				//若未设置有效的 defaultPointInfo，则根据图片缩放后的宽高初始化角点位置信息
				pointInfo[0] = 0;
				pointInfo[1] = 0;
				pointInfo[2] = dragBgImage.width;
				pointInfo[3] = 0
				pointInfo[4] = dragBgImage.width;
				pointInfo[5] = dragBgImage.height;
				pointInfo[6] = 0;
				pointInfo[7] = dragBgImage.height;
			}
			
			//绘制画板的初始形态
			drawRect();
			
		};
		//将图片添加到画板里
		dragBgContent.append(dragBgImage);
	}else if(settings.defaultPointInfo.length==8){
		for (var i=0;i < settings.defaultPointInfo.length;i++) {
			pointInfo[i] = settings.defaultPointInfo[i];
		}
	}else{
		//如果 dragBgSrc 和 defaultPointInfo 都未设置
		pointInfo[0] = 0;
		pointInfo[1] = 0;
		pointInfo[2] = canvasEditer.width();
		pointInfo[3] = 0
		pointInfo[4] = canvasEditer.width();
		pointInfo[5] = canvasEditer.height();
		pointInfo[6] = 0;
		pointInfo[7] = canvasEditer.height();
	}
	
	//绘制画板的初始形态
	drawRect();
	
	//方法：绘制画布
	function drawRect(){	
		var ctx = canvasEditer[0].getContext('2d');
		ctx.clearRect(0,0,canvasEditer.width(),canvasEditer.height());
		
		//更新中点坐标信息
		getMidPointInfo();
		
		//开始绘制画板里的内容
		ctx.beginPath();
		
		if(drawErrorRect){
			ctx.strokeStyle = settings.errorLineColor;
		}else{
			ctx.strokeStyle = settings.defaultLineColor;
		}
		
		ctx.lineWidth = brushThickness;
		ctx.moveTo(pointInfo[0],pointInfo[1]);
		ctx.lineTo(pointInfo[2],pointInfo[3]);
		ctx.lineTo(pointInfo[4],pointInfo[5]);
		ctx.lineTo(pointInfo[6],pointInfo[7]);
		ctx.closePath();
		ctx.stroke();
				
		drawArc(pointInfo[0],pointInfo[1],vertexOuterRadius,vertexInnerRadius);
		drawArc(pointInfo[2],pointInfo[3],vertexOuterRadius,vertexInnerRadius);
		drawArc(pointInfo[4],pointInfo[5],vertexOuterRadius,vertexInnerRadius);
		drawArc(pointInfo[6],pointInfo[7],vertexOuterRadius,vertexInnerRadius);
	
		drawArc(midPointInfo[0],midPointInfo[1],midpointOuterRadius,midpointInnerRadius);
		drawArc(midPointInfo[2],midPointInfo[3],midpointOuterRadius,midpointInnerRadius);
		drawArc(midPointInfo[4],midPointInfo[5],midpointOuterRadius,midpointInnerRadius);
		drawArc(midPointInfo[6],midPointInfo[7],midpointOuterRadius,midpointInnerRadius);
	};
	
	//绘制圆形拖拽点
	function drawArc(a,b,c,d){
		var ctx = canvasEditer[0].getContext('2d'); 
		ctx.beginPath();
		if(drawErrorRect){
			ctx.strokeStyle = settings.errorRadiusColor;
		}else{
			ctx.strokeStyle = settings.defaultRadiusColor;
		}
		ctx.lineWidth = 2*(c-d); //半径等于圆心到圆边线中心的距离
		ctx.arc(a, b, c, 0, Math.PI*2);
		ctx.stroke();
		ctx.closePath();
		
		ctx.beginPath(); 
		ctx.fillStyle = settings.innerRadiusFillColor;
		ctx.arc(a, b, d, 0, Math.PI*2);
		ctx.fill();
		ctx.closePath();
	};
	
	canvasEditer.on("mousedown",function(e){
		var ctx = canvasEditer[0].getContext('2d');
		var mouseX = (e || window.event).offsetX;
		var mouseY = (e || window.event).offsetY;
		
		//根据鼠标落点计算响应拖拽的是哪个点（顶点和中点均可拖拽）
		for(var i=0;i<pointInductor.length;i++){
			if(i<4){
				//判断四个角点是否在响应范围
				pointInductor[i] = (Math.abs(pointInfo[2*i]-mouseX)<2*vertexOuterRadius-vertexInnerRadius&&Math.abs(pointInfo[2*i+1]-mouseY)<2*vertexOuterRadius-vertexInnerRadius)?true:false;
			}else{
				//判断四个中点是否在响应范围
				pointInductor[i] = (Math.abs(midPointInfo[2*(i-4)]-mouseX)<2*midpointOuterRadius-midpointInnerRadius&&Math.abs(midPointInfo[2*(i-4)+1]-mouseY)<2*midpointOuterRadius-midpointInnerRadius)?true:false;
			}
		}
		
		//确保角点和中点中最多只有一个在响应拖拽的范围内
		for(var i=pointInductor.length-1;i>-1;i--){
			if(i<4&&pointInductor[i]==true){
			   for(var j=0;j<pointInductor.length;j++){
				  if(i!=j){
					  pointInductor[j] = false;
				  }
			   }
			}
		};
		
		//缓存操作点被移动前的坐标（用于拖拽出凹四边形时的还原）
		for(var i=0;i<pointInductor.length;i++){
			if(pointInductor[i]==true&&!invalidShape){
			  curDragPointIndex = i;
			  if(i<4){
				//缓存角点坐标
				tempX = pointInfo[2*i];
				tempY = pointInfo[2*i+1];
			  }else{
				//缓存中点坐标
				tempX0 = pointInfo[2*(i-4)], tempY0 = pointInfo[2*(i-4)+1],
				tempX1 = pointInfo[(2*(i-4)+2)%8], tempY1 = pointInfo[(2*(i-4)+3)%8];
			  }
			}
		};
		
		//鼠标移动响应事件		
		$(this).mousemove(function(e){
			var mouseX = (e || window.event).offsetX;
			var mouseY = (e || window.event).offsetY;
			
			//实时显示 mouse 坐标
			$(settings.mouseX).html(mouseX);
			$(settings.mouseY).html(mouseY);
			
			for(var i=0;i<pointInductor.length;i++){
				if(i<4&&pointInductor[i]== true){
					  $(this).css("cursor","move");
					  ctx.clearRect(0,0,canvasEditer.width(),canvasEditer.height());
											  
					  pointInfo[2*i] = mouseX; pointInfo[2*i+1] = mouseY;
					  
					  //更新斜率数组
					  getSlopeSide();
					  
					  //检查四个角点是否碰到画板边界
					  checkPointBorder();	
					  
					  if(checkPointShape()){   						
						  drawErrorRect = true;
					   }else{
						  drawErrorRect = false;
					  };
										  
					  drawRect();
	
					}else if(i==4&&pointInductor[4]== true){
					  $(this).css("cursor","move");
					  ctx.clearRect(0,0,canvasEditer.width(),canvasEditer.height());
					  var tempa1 = pointInfo[0],tempb1 = pointInfo[1],
						  tempa2 = pointInfo[2],tempb2 = pointInfo[3];
	
					  var a0 = slopeSide[0],b0=-1,c0=mouseY-slopeSide[0]*mouseX;
					  var a1 = slopeSide[1],b1=-1,c1=pointInfo[3]-slopeSide[1]*pointInfo[2];
					  var a2 = slopeSide[3],b2=-1,c2=pointInfo[1]-slopeSide[3]*pointInfo[0];
					  
					  if(slopeSide[0]==0){
						  if(slopeSide[1]=='Infinity'){
							pointInfo[2] = pointInfo[2];
							pointInfo[3] = mouseY;
							
						  }else{
							pointInfo[2] = (mouseY-pointInfo[3])/slopeSide[1]+pointInfo[2];
							pointInfo[3] = mouseY;
						  }
						  if(slopeSide[3]=='Infinity'){
							pointInfo[0] = pointInfo[0];
							pointInfo[1] = mouseY;
						  }else{
							pointInfo[0] = (mouseY-pointInfo[1])/slopeSide[3]+pointInfo[0];
							pointInfo[1] = mouseY;
						  }
					  }else if(slopeSide[0]=='Infinity'){
						  if(slopeSide[1]==0){
							pointInfo[2] = mouseX;
							pointInfo[3] = pointInfo[3];
						  }else{
							pointInfo[3] = slopeSide[1]*(mouseX-pointInfo[2])+pointInfo[3];
							pointInfo[2] = mouseX;
						  }
						  if(slopeSide[3]==0){
							pointInfo[0] = mouseX;
							pointInfo[1] = pointInfo[1];
						  }else{
							pointInfo[1] = slopeSide[3]*(mouseX-pointInfo[0])+pointInfo[1];
							pointInfo[0] = mouseX;
						  }
						  
					  }else{
						  if(slopeSide[1]==0){
							pointInfo[2] = pointInfo[2]+(mouseX-midPointInfo[0]);
							pointInfo[3] = pointInfo[3];
						  }else if(slopeSide[1]=='Infinity'){
							pointInfo[2] = pointInfo[2];
							pointInfo[3] = pointInfo[3]+(mouseY-midPointInfo[1]);								
						  }else{
							  
							pointInfo[2] = (b1*c0-b0*c1)/(a1*b0-a0*b1);
							pointInfo[3] = (a0*c1-a1*c0)/(a1*b0-a0*b1);
						  }
						  
						  if(slopeSide[3]==0){
							pointInfo[0] = pointInfo[0]+(mouseX-midPointInfo[0]);
							pointInfo[1] = pointInfo[1];
						  }else if(slopeSide[3]=='Infinity'){
							pointInfo[0] = pointInfo[0];
							pointInfo[1] = pointInfo[1]+(mouseY-midPointInfo[1]);					
						  }else{
							  
							pointInfo[0] = (b2*c0-b0*c2)/(a2*b0-a0*b2);
							pointInfo[1] = (a0*c2-a2*c0)/(a2*b0-a0*b2);
						  }
					  };
	
					  checkPointBorder();
					  if(checkPointShape()){
						 //_this.editorCanvas.onmouseup();
						 drawErrorRect = true;
						 pointInfo[0]=tempa1;
						 pointInfo[1]=tempb1;
						 pointInfo[2]=tempa2;
						 pointInfo[3]=tempb2;
					  }else{
						 drawErrorRect = false;
					  };						  
					  drawRect();
					}else if(i==5&&pointInductor[5]== true){
					  $(this).css("cursor","move");
					  ctx.clearRect(0,0,canvasEditer.width(),canvasEditer.height());
					  var tempa1 = pointInfo[2],tempb1 = pointInfo[3],
						  tempa2 = pointInfo[4],tempb2 = pointInfo[5];
					  
					  var a0 = slopeSide[1],b0=-1,c0=mouseY-slopeSide[1]*mouseX;
					  var a1 = slopeSide[0],b1=-1,c1=pointInfo[3]-slopeSide[0]*pointInfo[2];
					  var a2 = slopeSide[2],b2=-1,c2=pointInfo[5]-slopeSide[2]*pointInfo[4];						  
					  
					  if(slopeSide[1]==0){
						  if(slopeSide[2]=='Infinity'){
							pointInfo[4] = pointInfo[4];
							pointInfo[5] = mouseY;
							
						  }else{
							pointInfo[4] = (mouseY-pointInfo[5])/slopeSide[2]+pointInfo[4];
							pointInfo[5] = mouseY;
						  }
						  if(slopeSide[0]=='Infinity'){
							pointInfo[2] = pointInfo[2];
							pointInfo[3] = mouseY;
						  }else{
							pointInfo[2] = (mouseY-pointInfo[3])/slopeSide[0]+pointInfo[2];
							pointInfo[3] = mouseY;
						  }
					  }else if(slopeSide[1]=='Infinity'){
						  if(slopeSide[2]==0){
							pointInfo[4] = mouseX;
							pointInfo[5] = pointInfo[5];
						  }else{
							pointInfo[5] = slopeSide[2]*(mouseX-pointInfo[4])+pointInfo[5];
							pointInfo[4] = mouseX;
						  }
						  if(slopeSide[0]==0){
							pointInfo[2] = mouseX;
							pointInfo[3] = pointInfo[3];
						  }else{
							pointInfo[3] = slopeSide[0]*(mouseX-pointInfo[2])+pointInfo[3];
							pointInfo[2] = mouseX;
						  }
						  
					  }else{
						  if(slopeSide[2]==0){
							pointInfo[4] = pointInfo[4]+(mouseX-midPointInfo[2]);
							pointInfo[5] = pointInfo[5];
						  }else if(slopeSide[2]=='Infinity'){
							pointInfo[4] = pointInfo[4];
							pointInfo[5] = pointInfo[5]+(mouseY-midPointInfo[3]);								
						  }else{
							  
							pointInfo[4] = (b2*c0-b0*c2)/(a2*b0-a0*b2);
							pointInfo[5] = (a0*c2-a2*c0)/(a2*b0-a0*b2);
						  }
						  
						  if(slopeSide[0]==0){
							pointInfo[2] = pointInfo[2]+(mouseX-midPointInfo[2]);
							pointInfo[3] = pointInfo[3];
						  }else if(slopeSide[0]=='Infinity'){
							pointInfo[2] = pointInfo[2];
							pointInfo[3] = pointInfo[3]+(mouseY-midPointInfo[3]);					
						  }else{
							  
							pointInfo[2] = (b1*c0-b0*c1)/(a1*b0-a0*b1);
							pointInfo[3] = (a0*c1-a1*c0)/(a1*b0-a0*b1);
						  }
					  };
					  checkPointBorder();
					  if(checkPointShape()){
						 //_this.editorCanvas.onmouseup();
						 drawErrorRect = true;
						 pointInfo[2]=tempa1;
						 pointInfo[3]=tempb1;
						 pointInfo[4]=tempa2;
						 pointInfo[5]=tempb2;
					  }else{
						 drawErrorRect = false;
					  };	
					  drawRect();
					}else if(i==6&&pointInductor[6]== true){
					  $(this).css("cursor","move");
					  ctx.clearRect(0,0,canvasEditer.width(),canvasEditer.height());
					  var tempa1 = pointInfo[4],tempb1 = pointInfo[5],
						  tempa2 = pointInfo[6],tempb2 = pointInfo[7];
					  
					  var a0 = slopeSide[2],b0=-1,c0=mouseY-slopeSide[2]*mouseX;
					  var a1 = slopeSide[1],b1=-1,c1=pointInfo[5]-slopeSide[1]*pointInfo[4];
					  var a2 = slopeSide[3],b2=-1,c2=pointInfo[7]-slopeSide[3]*pointInfo[6];
					  
					  if(slopeSide[2]==0){
						  if(slopeSide[3]=='Infinity'){
							pointInfo[6] = pointInfo[6];
							pointInfo[7] = mouseY;
							
						  }else{
							pointInfo[6] = (mouseY-pointInfo[7])/slopeSide[3]+pointInfo[6];
							pointInfo[7] = mouseY;
						  }
						  if(slopeSide[1]=='Infinity'){
							pointInfo[4] = pointInfo[4];
							pointInfo[5] = mouseY;
						  }else{
							pointInfo[4] = (mouseY-pointInfo[5])/slopeSide[1]+pointInfo[4];
							pointInfo[5] = mouseY;
						  }
					  }else if(slopeSide[2]=='Infinity'){
						  if(slopeSide[3]==0){
							pointInfo[6] = mouseX;
							pointInfo[7] = pointInfo[7];
						  }else{
							pointInfo[7] = slopeSide[3]*(mouseX-pointInfo[6])+pointInfo[7];
							pointInfo[6] = mouseX;
						  }
						  if(slopeSide[1]==0){
							pointInfo[4] = mouseX;
							pointInfo[5] = pointInfo[5];
						  }else{
							pointInfo[5] = slopeSide[1]*(mouseX-pointInfo[4])+pointInfo[5];
							pointInfo[4] = mouseX;
						  }
						  
					  }else{
						  if(slopeSide[3]==0){
							pointInfo[6] = pointInfo[6]+(mouseX-midPointInfo[4]);
							pointInfo[7] = pointInfo[7];
						  }else if(slopeSide[3]=='Infinity'){
							pointInfo[6] = pointInfo[6];
							pointInfo[7] = pointInfo[7]+(mouseY-midPointInfo[5]);								
						  }else{
							pointInfo[6] = (b2*c0-b0*c2)/(a2*b0-a0*b2);
							pointInfo[7] = (a0*c2-a2*c0)/(a2*b0-a0*b2);
						  }
						  
						  if(slopeSide[1]==0){
							pointInfo[4] = pointInfo[4]+(mouseX-midPointInfo[4]);
							pointInfo[5] = pointInfo[5];
						  }else if(slopeSide[1]=='Infinity'){
							pointInfo[4] = pointInfo[4];
							pointInfo[5] = pointInfo[5]+(mouseY-midPointInfo[5]);					
						  }else{
							  
							pointInfo[4] = (b1*c0-b0*c1)/(a1*b0-a0*b1);
							pointInfo[5] = (a0*c1-a1*c0)/(a1*b0-a0*b1);
						  }
					  };
					  checkPointBorder();
					  if(checkPointShape()){
						 //_this.editorCanvas.onmouseup();
						 drawErrorRect = true;
						 pointInfo[4]=tempa1;
						 pointInfo[5]=tempb1;
						 pointInfo[6]=tempa2;
						 pointInfo[7]=tempb2;
					  }else{
						 drawErrorRect = false;
					  };	
					  drawRect();
					}else if(i==7&&pointInductor[7]== true){
					  $(this).css("cursor","move");
					  ctx.clearRect(0,0,canvasEditer.width(),canvasEditer.height());
					  var tempa1 = pointInfo[6],tempb1 = pointInfo[7],
						  tempa2 = pointInfo[0],tempb2 = pointInfo[1];
					  
					  var a0 = slopeSide[3],b0=-1,c0=mouseY-slopeSide[3]*mouseX;
					  var a1 = slopeSide[2],b1=-1,c1=pointInfo[7]-slopeSide[2]*pointInfo[6];
					  var a2 = slopeSide[0],b2=-1,c2=pointInfo[1]-slopeSide[0]*pointInfo[0];
					  
					  if(slopeSide[3]==0){
						  if(slopeSide[0]=='Infinity'){
							pointInfo[0] = pointInfo[0];
							pointInfo[1] = mouseY;
							
						  }else{
							pointInfo[0] = (mouseY-pointInfo[1])/slopeSide[0]+pointInfo[0];
							pointInfo[1] = mouseY;
						  }
						  if(slopeSide[2]=='Infinity'){
							pointInfo[6] = pointInfo[6];
							pointInfo[7] = mouseY;
						  }else{
							pointInfo[6] = (mouseY-pointInfo[7])/slopeSide[2]+pointInfo[6];
							pointInfo[7] = mouseY;
						  }
					  }else if(slopeSide[3]=='Infinity'){
						  if(slopeSide[0]==0){
							pointInfo[0] = mouseX;
							pointInfo[1] = pointInfo[1];
						  }else{
							pointInfo[1] = slopeSide[0]*(mouseX-pointInfo[0])+pointInfo[1];
							pointInfo[0] = mouseX;
						  }
						  if(slopeSide[2]==0){
							pointInfo[6] = mouseX;
							pointInfo[7] = pointInfo[7];
						  }else{
							pointInfo[7] = slopeSide[2]*(mouseX-pointInfo[6])+pointInfo[7];
							pointInfo[6] = mouseX;
						  }
						  
					  }else{
						  if(slopeSide[0]==0){
							pointInfo[0] = pointInfo[0]+(mouseX-midPointInfo[6]);
							pointInfo[1] = pointInfo[1];
						  }else if(slopeSide[0]=='Infinity'){
							pointInfo[0] = pointInfo[0];
							pointInfo[1] = pointInfo[1]+(mouseY-midPointInfo[7]);								
						  }else{
							pointInfo[0] = (b2*c0-b0*c2)/(a2*b0-a0*b2);
							pointInfo[1] = (a0*c2-a2*c0)/(a2*b0-a0*b2);
						  }
						  
						  if(slopeSide[2]==0){
							pointInfo[6] = pointInfo[6]+(mouseX-midPointInfo[6]);
							pointInfo[7] = pointInfo[7];
						  }else if(slopeSide[2]=='Infinity'){
							pointInfo[6] = pointInfo[6];
							pointInfo[7] = pointInfo[7]+(mouseY-midPointInfo[7]);					
						  }else{
							pointInfo[6] = (b1*c0-b0*c1)/(a1*b0-a0*b1);
							pointInfo[7] = (a0*c1-a1*c0)/(a1*b0-a0*b1);
						  }
					  };
					  checkPointBorder();
					  if(checkPointShape()){
						 //_this.editorCanvas.onmouseup();
						 drawErrorRect = true;
						 pointInfo[6]=tempa1;
						 pointInfo[7]=tempb1;
						 pointInfo[0]=tempa2;
						 pointInfo[1]=tempb2;
					  }else{
						 drawErrorRect = false;
					  };	
					  drawRect();
					}
			   }
		 });
		
	});
	 
	canvasEditer.on("mouseup",function(e){
		$(this).css("cursor","default");
		//$(this).mousemove() = null;
		$(this).off("mousemove");
		
		if(curDragPointIndex<4){
		   if(invalidShape){   				   
			   pointInfo[2*curDragPointIndex] = tempX;
			   pointInfo[2*curDragPointIndex+1] = tempY;
			   
			   getSlopeSide();
			   drawErrorRect = false;
			   drawRect();
			   invalidShape = false;
		   };
		}else if(curDragPointIndex>=4){
			if(invalidShape){
				var i = curDragPointIndex;
				pointInfo[2*(i-4)] = tempX0, pointInfo[2*(i-4)+1] = tempY0,
				pointInfo[(2*(i-4)+2)%8] = tempX1, pointInfo[(2*(i-4)+3)%8] = tempY1;
			   getSlopeSide();
			   drawErrorRect = false;
			   drawRect();
			   invalidShape = false;
			}
		};
	
		var p = pointInfo;
		var x0 = p[0], y0 = p[1],
			x1 = p[2], y1 = p[3],
			x2 = p[4], y2 = p[5],
			x3 = p[6], y3 = p[7];
	
		while(x0>=x1 || y1>=y2 || x2<=x3 || y3<=y0 || Math.abs((y1+y2-y0-y3)/(x1+x2-x3-x0))>Math.abs((y2+y3-y0-y1)/(x2+x3-x0-x1))){
			var _x = x0;
			x0 = x1, x1 = x2, x2 = x3, x3 = _x;
			var _y = y0;
			y0 = y1, y1 = y2, y2 = y3, y3 = _y;
		}
		p[0] = x0, p[1] = y0,
		p[2] = x1, p[3] = y1,
		p[4] = x2, p[5] = y2,
		p[6] = x3, p[7] = y3;
	
	});
	
	canvasEditer.on("mouseout",function(e){
		$(this).css("cursor","default");
		//$(this).mousemove() = null;
		$(this).off("mousemove");
		//$(this).mouseup();
	});
	
	canvasEditer.on("mouseover",function(e){
		$(this).css("cursor","default");
		//$(this).mousemove() = null;
		$(this).off("mousemove");
		//$(this).mouseup();
	});
	
	//更新中点坐标数组
	function getMidPointInfo(){
		midPointInfo[0] =  (pointInfo[0]+pointInfo[2])/2;
		midPointInfo[1] =  (pointInfo[1]+pointInfo[3])/2;
		
		midPointInfo[2] =  (pointInfo[2]+pointInfo[4])/2;
		midPointInfo[3] =  (pointInfo[3]+pointInfo[5])/2;
		
		midPointInfo[4] =  (pointInfo[4]+pointInfo[6])/2;
		midPointInfo[5] =  (pointInfo[5]+pointInfo[7])/2;
		
		midPointInfo[6] =  (pointInfo[6]+pointInfo[0])/2;
		midPointInfo[7] =  (pointInfo[7]+pointInfo[1])/2;
		return midPointInfo;
	};
	
	//计算四条边的斜率
	function getSlopeSide() {
	   for(var i=0;i<4;i++){
		  if(i<3){
			if((pointInfo[2*i+3]-pointInfo[2*i+1])==0&&(pointInfo[2*(i+1)]-pointInfo[2*i])==0){
				slopeSide[i] = 0;
			}else{
				slopeSide[i] = (pointInfo[2*i+3]-pointInfo[2*i+1])/(pointInfo[2*(i+1)]-pointInfo[2*i]);
			};
			 
		  }else if(i==3){
			  if((pointInfo[7]-pointInfo[1])==0&&(pointInfo[6]-pointInfo[0])==0){
				 slopeSide[3] = 0;
			  }else{
				slopeSide[3] = (pointInfo[7]-pointInfo[1])/(pointInfo[6]-pointInfo[0]);
				};
			  
		  }
	   };
	   return slopeSide;
	};
	
	//检查四个角点是否触及画板边界
	function checkPointBorder() {
		for(var i=0;i<pointInfo.length/2;i++){
			if(pointInfo[2*i]<0){
				pointInfo[2*i] = 0;
			}else if(pointInfo[2*i]>canvasEditer.width()-1){
				pointInfo[2*i] = canvasEditer.width()-1;
			}
			if(pointInfo[2*i+1]<0){
				pointInfo[2*i+1] = 0;
			}else if(pointInfo[2*i+1]>canvasEditer.height()-1){
				pointInfo[2*i+1] = canvasEditer.height()-1;
			}
		};
	};
	
	//检查四个角点构成的四边形是否合法
	function checkPointShape() {
		var p = pointInfo;
		var x0 = p[0], y0 = p[1],
			x1 = p[2], y1 = p[3],
			x2 = p[4], y2 = p[5],
			x3 = p[6], y3 = p[7];
	
		// 0 = A*x + B*y + C
		// 0 = (y2-y0)*x + (x0-x2)*y + x2*y0-x0*y2
		var a0 = y2-y0, b0 = x0-x2, c0 = x2*y0-x0*y2;
		// 0 = (y3-y1)*x + (x1-x3)*y + x3*y1-x1*y3
		var a1 = y3-y1, b1 = x1-x3, c1 = x3*y1-x1*y3;
	
		if(!((a0*x1+b0*y1+c0)>0 && (a0*x3+b0*y3+c0)<0 &&
			(a1*x0+b1*y0+c1)<0 && (a1*x2+b1*y2+c1)>0))
		{
		   invalidShape = true;
		   return true;
		}
		invalidShape = false;
		return false;
	};
}
})(jQuery);