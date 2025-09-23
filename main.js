


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
		VisualEditor.updateCursor();
		
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
		VisualEditor.updateCursor();
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
		VisualEditor.updateCursor();
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
		VisualEditor.updateCursor();
}


window.patchmap = {}
window.patchmap.hitboxes = [];