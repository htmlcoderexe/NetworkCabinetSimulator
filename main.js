class VisualEditorSelection
{
	selection = [];
	construct()
	{
		this.selection = [];
	}
	add(items, fireEvent = true)
	{
		this.remove(items, false);
		this.selection.push(...items);
		if(fireEvent)
			VisualEditor.selectionChange();
}
	remove(items, fireEvent = true)
	{
		this.selection = this.selection.filter(item=>!items.includes(item));
		if(fireEvent)
			VisualEditor.selectionChange();
}
	clear(fireEvent = true)
	{
		this.selection = [];
		if(fireEvent)
			VisualEditor.selectionChange();
	}
	set(items, fireEvent = true)
	{
		this.clear(false);
		this.add(items, false);
		if(fireEvent)
			VisualEditor.selectionChange();
}
	forEach(func)
	{
		if(!this.selection)
			return;
		this.selection.forEach(func);
	}
}

class VisualEditor
{
	static currentSelection = new VisualEditorSelection();
	static currentHightlight = [];
	static currentDepth = 0;
	static ctrl = false;
	static shift = false;
	static mouseDownNow = false;
	static mouseDownPrev = false;
	static fixedMap = null;
	static lineMap = null;
	static currentMoving = null;
	static currentMovingX = 0;
	static currentMovingY = 0;
	static getMouseHits(x, y, onlyTopLevel = false)
	{
		let results = VisualItem.hitboxMapping.filter(box=>{return box.hitbox.contains(x, y)});
		results = results.filter(box=>box.item.testHit(x, y));
		results.sort((a, b)=>b.level-a.level);
		if(results && onlyTopLevel)
		{
			results = results.filter(box=>box.level == results[0].level);	
		}
		let hits = [];
		results.forEach(box=>hits.push(box.item));
		return hits;
	}
	static redrawSelection(ctx)
	{
		ctx.clearRect(0,0,5000,5000);
		let style = {
			strokeStyle : "rgb(255 0 0 / 80%)",
			lineWidth: 5
		};
		let style2 = {
			strokeStyle : "red",
			lineWidth: 3
		};
		let style3 = {
			strokeStyle :"rgb(255 0 0 / 30%)",
			lineWidth: 3
		};
		if(VisualEditor.currentHightlight)
		{
			VisualEditor.currentHightlight.forEach(box=>box.drawHighlight(ctx,style2));
			VisualEditor.currentHightlight.forEach(box=>box.drawHighlight(ctx,style3));
		}
		if(VisualEditor.currentSelection)
		{
			VisualEditor.currentSelection.selection.forEach(box=>box.drawHighlight(ctx,style));
		}
	}
	static redrawItems(ctx)
	{
		ctx.clearRect(0,0,5000,5000);
		VisualEditor.fixedMap.draw(ctx);
		VisualEditor.lineMap.draw(ctx);
	}
	static selectionChange = function()
	{

	};
}




window.fiber = {};

function canvasHover(e)
{
	ctx = document.getElementById("selection_display").getContext("2d");
	ctx2 = document.getElementById("graphdisplay").getContext("2d");
	VisualEditor.ctrl = e.ctrlKey;
	VisualEditor.shift = e.shiftKey;
	if(VisualEditor.currentMoving)
	{
		VisualEditor.currentMoving.x = e.offsetX + VisualEditor.currentMovingX;
		VisualEditor.currentMoving.y = e.offsetY + VisualEditor.currentMovingY;
		VisualEditor.redrawItems(ctx2);
		VisualItem.hitboxMapping = [];
		VisualEditor.lineMap.updateSize();
		VisualEditor.lineMap.updatePosition();
		VisualEditor.lineMap.updateHitboxMapping();
		VisualEditor.fixedMap.updateSize();
		VisualEditor.fixedMap.updatePosition();
		VisualEditor.fixedMap.updateHitboxMapping();
		
		VisualEditor.redrawSelection(ctx)
		return;
	}
	let results = VisualEditor.getMouseHits(e.offsetX, e.offsetY, true);
	VisualEditor.currentHightlight = results;
	if(VisualEditor.currentHightlight.length > 0)
	{
		if(VisualEditor.currentHightlight[0].type == "location")
		{
			document.body.style.cursor = "move";
		}
		else
		{
			document.body.style.cursor = "auto";
		}
	}
	else
	{
		document.body.style.cursor = "auto";
	}
	let currentlabel = "";
	let currentrect = [];
	
		
	
	VisualEditor.redrawSelection(ctx)
	
	

	
	window.fiber.current = currentlabel;
	window.fiber.selection = currentrect;
}

function canvasMDown(e)
{
	VisualEditor.mouseDownNow = true;
	if(VisualEditor.currentHightlight.length > 0)
	{
		if(VisualEditor.currentHightlight[0].type == "location")
		{
			console.log("picked up", VisualEditor.currentHightlight[0]);
			VisualEditor.currentMoving = VisualEditor.currentHightlight[0];
			VisualEditor.currentMovingX = VisualEditor.currentMoving.x - e.offsetX;
			VisualEditor.currentMovingY = VisualEditor.currentMoving.y - e.offsetY;
		}
		else
		{
			document.body.style.cursor = "auto";
		}
	}
	else
	{
		document.body.style.cursor = "auto";
	}
}

function canvasMUp(e)
{
	VisualEditor.mouseDownNow = false;
	VisualEditor.currentMoving = null;
}

function canvasClick(e)
{
	let results = VisualEditor.getMouseHits(e.offsetX, e.offsetY, true);
	
	ctx = document.getElementById("selection_display").getContext("2d");
	if(results.length < 1)
	{
		if(!VisualEditor.ctrl)
		{
			console.log("before clear", VisualEditor.currentSelection);
			VisualEditor.currentSelection.clear();
			console.log("after clear", VisualEditor.currentSelection);
		}
			
		
		VisualEditor.redrawSelection(ctx)
		
		return;
	}
	if(e.detail > 1 && results[VisualEditor.currentDepth]?.type == "patch")
	{
		VisualEditor.currentSelection.set(results[VisualEditor.currentDepth].parent.subItems);
		
		VisualEditor.redrawSelection(ctx);
		return;
	}
	VisualEditor.currentDepth++;
	if(VisualEditor.currentDepth >= results.length)
	{
		VisualEditor.currentDepth = 0;
	}
	if(VisualEditor.ctrl)
	{
		VisualEditor.currentSelection.add([results[VisualEditor.currentDepth]])
	}
	else
	{
		VisualEditor.currentSelection.set([results[VisualEditor.currentDepth]])
	}
	
	
	VisualEditor.redrawSelection(ctx);
}

window.patchmap = {}
window.patchmap.hitboxes = [];