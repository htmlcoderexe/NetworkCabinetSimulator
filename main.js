


window.fiber = {};

function canvasHover(e)
{
		//let x = e.offsetX;
		//let y = e.offsetY;
		VisualEditor.ctrl = e.ctrlKey;
		VisualEditor.shift = e.shiftKey;
		let [x,y] = VisualEditor.screenToCanvas(e.offsetX,e.offsetY);
		if(VisualEditor.currentMoving)
		{
			VisualEditor.currentMoving.x = x + VisualEditor.currentMovingX;
			VisualEditor.currentMoving.y = y + VisualEditor.currentMovingY;
			VisualEditor.currentMoving.updatePosition();
			VisualEditor.refreshView();
			//console.log(VisualEditor.currentMoving);
		}
		if(VisualEditor.draggingView)
		{
			VisualEditor.offsetX=VisualEditor.dragX+e.offsetX;//VisualEditor.zoom;
			VisualEditor.offsetY=VisualEditor.dragY+e.offsetY;//VisualEditor.zoom;
			VisualEditor.refreshView();
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
			case VisualEditor.EDIT_MODES.LINK:
			{
				VisualEditor.handleMMoveLinkMode(x,y);
				break;
			}
		}
		VisualEditor.updateCursor();
		
}

function canvasMDown(e)
{
	let [x,y] = VisualEditor.screenToCanvas(e.offsetX,e.offsetY);
	VisualEditor.mouseDownNow = true;
	VisualEditor.dragX=-(e.offsetX)+VisualEditor.offsetX;
	VisualEditor.dragY=-(e.offsetY)+VisualEditor.offsetY;
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
		case VisualEditor.EDIT_MODES.LINK:
		{
			VisualEditor.handleMDownLinkMode(x,y);
			break;
		}
	}
		VisualEditor.updateCursor();
}

function canvasMUp(e)
{
	let [x,y] = VisualEditor.screenToCanvas(e.offsetX,e.offsetY);
	VisualEditor.mouseDownNow = false;
	VisualEditor.draggingView=false;
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
		case VisualEditor.EDIT_MODES.LINK:
		{
			VisualEditor.handleMUpLinkMode(x,y);
			break;
		}
	}
		VisualEditor.updateCursor();
}

function canvasClick(e)
{
	
	let [x,y] = VisualEditor.screenToCanvas(e.offsetX,e.offsetY);
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
		case VisualEditor.EDIT_MODES.LINK:
		{
			VisualEditor.handleLinkMode(x,y,dbl);
			break;
		}
	}
		VisualEditor.updateCursor();
}


window.patchmap = {}
window.patchmap.hitboxes = [];