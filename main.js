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
	static inventory = null;
	static currentMoving = null;
	static currentMovingX = 0;
	static currentMovingY = 0;
	static mapLayer = null;
	static highlightLayer = null;
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
	static redrawSelection()
	{
		const ctx = VisualEditor.highlightLayer;
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
	static redrawItems()
	{
		const ctx = VisualEditor.mapLayer;
		ctx.clearRect(0,0,5000,5000);
		VisualEditor.fixedMap.draw(ctx);
		VisualEditor.lineMap.draw(ctx);
		VisualEditor.fixedMap.drawCollapsed(ctx);
	}

	static refreshView()
	{
		
		VisualEditor.redrawItems();
		VisualItem.hitboxMapping = [];
		VisualEditor.lineMap.updateSize();
		VisualEditor.lineMap.updatePosition();
		VisualEditor.lineMap.updateHitboxMapping();
		VisualEditor.fixedMap.updateSize();
		VisualEditor.fixedMap.updatePosition();
		VisualEditor.fixedMap.updateHitboxMapping();
		
		VisualEditor.redrawSelection()
	}
	static selectLine(name)
	{
		const line = VisualEditor.lineMap.find(name);
		if(line)
		{
			VisualEditor.currentSelection.set([line]);
			VisualEditor.redrawSelection();
		}
	}

	static selectionChange = function()
	{

	};
}




window.fiber = {};

function canvasHover(e)
{
	VisualEditor.ctrl = e.ctrlKey;
	VisualEditor.shift = e.shiftKey;
	if(VisualEditor.currentMoving)
	{
		VisualEditor.currentMoving.x = e.offsetX + VisualEditor.currentMovingX;
		VisualEditor.currentMoving.y = e.offsetY + VisualEditor.currentMovingY;
								VisualEditor.refreshView();
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
	
		
	
	VisualEditor.redrawSelection()
	
	

	
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
	
	if(results.length < 1)
	{
		if(!VisualEditor.ctrl)
		{
			console.log("before clear", VisualEditor.currentSelection);
			VisualEditor.currentSelection.clear();
			console.log("after clear", VisualEditor.currentSelection);
		}
			
		
		VisualEditor.redrawSelection()
		
		return;
	}
	if(e.detail > 1 && results[VisualEditor.currentDepth]?.type == "patch")
	{
		VisualEditor.currentSelection.set(results[VisualEditor.currentDepth].parent.subItems);
		
		VisualEditor.redrawSelection();
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
	
	
	VisualEditor.redrawSelection();
}


window.patchmap = {}
window.patchmap.hitboxes = [];