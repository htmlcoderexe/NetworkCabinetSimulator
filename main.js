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
			VisualEditor.triggerSelectionChange();
}
	remove(items, fireEvent = true)
	{
		this.selection = this.selection.filter(item=>!items.includes(item));
		if(fireEvent)
			VisualEditor.triggerSelectionChange();
}
	clear(fireEvent = true)
	{
		this.selection = [];
		if(fireEvent)
			VisualEditor.triggerSelectionChange();
	}
	set(items, fireEvent = true)
	{
		this.clear(false);
		this.add(items, false);
		if(fireEvent)
			VisualEditor.triggerSelectionChange();
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
	static EDIT_MODES = {POINTER: 0, WIRE: 1, ADD: 2};
	static editMode = this.EDIT_MODES.POINTER;
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
	static currentSingleItem = null;
	static currentSingleType = "";
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

	static triggerSelectionChange()
	{
		// for contextual actions requiring a specific item type to be selected
		if(VisualEditor.currentSelection.selection.length> 0)
		{
			console.log("non-empty selection made");
			if(VisualEditor.currentSelection.selection.length === 1)
			{

				VisualEditor.currentSingleItem = VisualEditor.currentSelection.selection[0];
				VisualEditor.currentSingleType = VisualEditor.currentSingleItem.type;
				console.log("exactly one item of type <" + VisualEditor.currentSingleType + "> picked");
			}
			else
			{
				
			VisualEditor.currentSingleItem = null;
			VisualEditor.currentSingleType = "";
			}
		}
		else
		{
			console.log("selection is empty now");
			VisualEditor.currentSingleItem = null;
			VisualEditor.currentSingleType = "";
		}
		this.selectionChange();
	}

	static selectionChange = function()
	{

	};

	static setModePointer()
	{
		document.body.style.cursor = "auto";
		VisualEditor.editMode = this.EDIT_MODES.POINTER;
	}
	static setModeWire()
	{
		document.body.style.cursor = "alias";
		VisualEditor.editMode = this.EDIT_MODES.WIRE;
	}

	static getDefaultCursor()
	{
		// console.log(VisualEditor.editMode);
		switch(VisualEditor.editMode)
		{
			case VisualEditor.EDIT_MODES.POINTER:
			{
				return "auto";
			}
			case VisualEditor.EDIT_MODES.WIRE:
			{
				return "alias";
			}
		}
	}

	static handleWireMode(x, y, dbl)
	{
		let results = VisualEditor.getMouseHits(x, y, true);
		
		if(results.length < 1)
		{
			console.log("no wires or sockets picked");
			return;
		}

		if(VisualEditor.currentMoving && VisualEditor.currentMoving.type == "socket" &&  results[0]?.type == "socket")
		{
			results[0].takeFrom(VisualEditor.currentMoving, VisualEditor.currentMoving.connections[0]);
			VisualEditor.currentMoving = null;
			VisualEditor.refreshView();
			return;
		}

		console.log( results[0]?.type);
		
			console.log(VisualEditor.currentSingleType, " +++ ", results[0]?.type);
		if(results[VisualEditor.currentDepth]?.type == "patch")
		{
			VisualEditor.currentDepth++;
			if(VisualEditor.currentDepth >= results.length)
			{
				VisualEditor.currentDepth = 0;
			}
			VisualEditor.currentSelection.set([results[VisualEditor.currentDepth]])
			console.log("wire selected!");		
			VisualEditor.redrawSelection();

			return;
		}
		else if(VisualEditor.currentSingleType == "patch" && results[0]?.type == "socket")
		{
			console.log("ready to wire!");
			let mSocket = new VisualSocket(VisualEditor.fixedMap, "mousemove");
			VisualEditor.currentMovingX=0;
			VisualEditor.currentMovingY=0;
			mSocket.takeFrom(results[0], VisualEditor.currentSingleItem);
			VisualEditor.currentMoving = mSocket;
			
			VisualEditor.redrawSelection();
		}
		else
		{
		}
		
		
		VisualEditor.redrawSelection();

	}
	static handleMUpWireMode(x, y)
	{

	}
	static handleMDownWireMode(x, y)
	{

	}
	static handleMMoveWireMode(x, y)
	{
		let results = VisualEditor.getMouseHits(x, y, true);
		if(results && results.length>0)
		{
			let iswire = results[0].type == "patch";
			let issocket = results[0].type == "socket";
			if(issocket || (!VisualEditor.currentMoving && iswire))
			{
				VisualEditor.currentHightlight = results;
			}

		}
		
		VisualEditor.redrawSelection();
		if(VisualEditor.currentMoving)
		{
			VisualEditor.currentMoving.updatePosition();
		}
	}
	static handlePointerMode(x, y, dbl)
	{
		let results = VisualEditor.getMouseHits(x, y, true);
		
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
		if(dbl && results[VisualEditor.currentDepth]?.type == "patch")
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
	static handleMDownPointerMode(x, y)
	{

		if(VisualEditor.currentHightlight.length > 0)
		{
			if(VisualEditor.currentHightlight[0].type == "location")
			{
				console.log("picked up", VisualEditor.currentHightlight[0]);
				VisualEditor.currentMoving = VisualEditor.currentHightlight[0];
				VisualEditor.currentMovingX = VisualEditor.currentMoving.x - x;
				VisualEditor.currentMovingY = VisualEditor.currentMoving.y - y;
			}
			else
			{
				document.body.style.cursor = VisualEditor.getDefaultCursor();
			}
		}
		else
		{
			document.body.style.cursor = VisualEditor.getDefaultCursor();
		}
	}
	static handleMUpPointerMode(x, y)
	{
		
		VisualEditor.currentMoving = null;
	}
	static handleMMovePointerMode(x, y)
	{
		let results = VisualEditor.getMouseHits(x, y, true);
		VisualEditor.currentHightlight = results;
		
		VisualEditor.redrawSelection();
		if(VisualEditor.currentHightlight.length > 0 && VisualEditor.editMode == VisualEditor.EDIT_MODES.POINTER)
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
			document.body.style.cursor = VisualEditor.getDefaultCursor();
		}
		let currentlabel = "";
		let currentrect = [];
		
			
		
		

		
		window.fiber.current = currentlabel;
	window.fiber.selection = currentrect;

	}
}




window.fiber = {};

function canvasHover(e)
{
		let x = e.offsetX;
		let y = e.offsetY;
		VisualEditor.ctrl = e.ctrlKey;
		VisualEditor.shift = e.shiftKey;
		if(VisualEditor.currentMoving)
		{
			VisualEditor.currentMoving.x = x + VisualEditor.currentMovingX;
			VisualEditor.currentMoving.y = y + VisualEditor.currentMovingY;
			VisualEditor.refreshView();
			//console.log(VisualEditor.currentMoving);
		}
		switch(VisualEditor.editMode)
		{
			case VisualEditor.EDIT_MODES.POINTER:
			{
				VisualEditor.handleMMovePointerMode(x,y);
				break;
			}
			case VisualEditor.EDIT_MODES.WIRE:
			{
				VisualEditor.handleMMoveWireMode(x,y);
				break;
			}
		}
		
}

function canvasMDown(e)
{
	let x = e.offsetX;
	let y = e.offsetY;
	VisualEditor.mouseDownNow = true;
	
	switch(VisualEditor.editMode)
	{
		case VisualEditor.EDIT_MODES.POINTER:
		{
			VisualEditor.handleMDownPointerMode(x,y);
			break;
		}
		case VisualEditor.EDIT_MODES.WIRE:
		{
			VisualEditor.handleMDownWireMode(x,y);
			break;
		}
	}
}

function canvasMUp(e)
{
	let x = e.offsetX;
	let y = e.offsetY;
	VisualEditor.mouseDownNow = false;
	switch(VisualEditor.editMode)
	{
		case VisualEditor.EDIT_MODES.POINTER:
		{
			VisualEditor.handleMUpPointerMode(x,y);
			break;
		}
		case VisualEditor.EDIT_MODES.WIRE:
		{
			VisualEditor.handleMUpWireMode(x,y);
			break;
		}
	}
}

function canvasClick(e)
{
	let x = e.offsetX;
	let y = e.offsetY;
	let dbl = e.detail > 1;

	switch(VisualEditor.editMode)
	{
		case VisualEditor.EDIT_MODES.POINTER:
		{
			VisualEditor.handlePointerMode(x,y,dbl);
			break;
		}
		case VisualEditor.EDIT_MODES.WIRE:
		{
			VisualEditor.handleWireMode(x,y,dbl);
			break;
		}
	}
}


window.patchmap = {}
window.patchmap.hitboxes = [];