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
	static SUB_MODES = {NONE: 0, WIRE_MOVE: 1, WIRE_ADD: 2, WIRE_REMOVE: 3, WIRE_SELECTED: 4, WIRE_LINE_SELECT: 5};
	
	static ITEM_REF_SEPARATOR = "/";

	static editMode = this.EDIT_MODES.POINTER;
	static subMode = this.SUB_MODES.NONE;
	
	
	static ctrl = false;
	static shift = false;
	static mouseDownNow = false;
	static mouseDownPrev = false;

	static currentDepth = 0;
	static currentSelection = new VisualEditorSelection();
	static currentHightlight = [];
	static currentSingleItem = null;
	static currentSingleType = "";

	static currentMoving = null;
	static currentMovingX = 0;
	static currentMovingY = 0;
	

	static fixedMap = null;
	static lineMap = null;
	static inventory = null;

	static mapLayer = null;
	static highlightLayer = null;
    static treeViewContainer = null;
	static propSheetContainer = null;
    static mouseArea = null;

	static treeItemTemplate = null;
	static itemPropSheetTemplate = null;

	/**
	 * Checks if any registered component hitboxes intersect a given coordinate.
	 * @param {number} x - X coordinate
	 * @param {number} y - Y coordinate
	 * @param {boolean} onlyTopLevel - if true, only results with the highest selection priority will be returned
	 * @returns a list of components intersecting the coordinate.
	 */
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

    static getTreeItems()
    {
        return this.treeViewContainer ? this.treeViewContainer.querySelectorAll("span.tree_item_name") : [];
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
        let itemIDs = [];
		if(VisualEditor.currentSelection)
		{
			VisualEditor.currentSelection.selection.forEach((box)=>{
			
					box.drawTop(ctx);
                box.drawHighlight(ctx,style);
                itemIDs.push(box.getFullName(VisualEditor.ITEM_REF_SEPARATOR));
            });
            VisualEditor.getTreeItems().forEach((item)=>{
                let objid = item.dataset.itemref;
                if(itemIDs.find(id=>id==objid))
                {
                    item.classList.add("selected");
                }
                else
                {
                    item.classList.remove("selected");
                }
            });
		}
        itemIDs = [];
		if(VisualEditor.currentHightlight)
		{
			VisualEditor.currentHightlight.forEach(box=>box.drawHighlight(ctx,style2));
			VisualEditor.currentHightlight.forEach((box)=>{
                box.drawHighlight(ctx,style3);
                itemIDs.push(box.getFullName(VisualEditor.ITEM_REF_SEPARATOR));
            });
            VisualEditor.getTreeItems().forEach((item)=>{
                let objid = item.dataset.itemref;
                if(itemIDs.find(id=>id==objid))
                {
                    item.classList.add("highlighted");
                }
                else
                {
                    item.classList.remove("highlighted");
                }
            });
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


	static buildPropSheet(target_object)
	{
		let tpl = VisualEditor.itemPropSheetTemplate.content.cloneNode(true);
		let itemref = target_object.getFullName("/");
		let item_badge = tpl.querySelector(".item_badge");
		item_badge.dataset.itemref = itemref;
		item_badge.dataset.itemtype = target_object.type;
		let item_label = tpl.querySelector(".item_title");
		item_label.dataset.itemref = itemref;
		item_label.dataset.itemtype = target_object.type;
		item_label.value = target_object.label == "" ? target_object.getLabel() : target_object.label;
        item_label.addEventListener("click",(e)=>
        {
            item_label.readOnly = false;
        });
        item_label.addEventListener("blur",(e)=>
        {
            target_object.label = item_label.value.trim();
            item_label.readOnly = true;
            VisualEditor.reportUpdate(target_object);
            VisualEditor.refreshView();
        });
		let sheet = tpl.querySelector(".item_properties");
		sheet.dataset.itemref = itemref;
		switch(target_object.type)
		{
			case "location":
			{
				let toggle = document.createElement("input");
				toggle.type = "checkbox";
				toggle.checked = target_object.collapseState;
				toggle.addEventListener("change",(e)=>{
					if(e.target.checked)
					{
						target_object.collapse();
					}
					else
					{
						target_object.uncollapse();
					}
					VisualEditor.refreshView();
				});
				toggle.dataset.itemref = itemref;
				toggle.id = itemref;
				sheet.appendChild(toggle);
				let lbl = document.createElement("label");
				lbl.append("Compact view");
				lbl.dataset.itemref = itemref;
				lbl.htmlFor = itemref;
				sheet.appendChild(lbl);
				break;
			}
			case "patch":
			{
				let badge = this.createLineBadge(target_object.parent);
				badge.dataset.lineName = target_object.parent.name;
				badge.addEventListener("click",(e)=>{
					VisualEditor.selectLine(e.target.dataset.lineName);
				});
				sheet.appendChild(badge);
				break;
			}
			case "line":
			{
				let c1 = document.createElement("input");
				c1.type="color";
				c1.value = target_object.colour1;
				c1.addEventListener("change",(e)=>{
					target_object.colour1 = c1.value;
                    VisualEditor.reportUpdate(target_object);
					VisualEditor.refreshView();
				});
				let c2 = document.createElement("input");
				c2.type="color";
				c2.value = target_object.colour2;
				c2.addEventListener("change",(e)=>{
					target_object.colour2 = c2.value;
                    VisualEditor.reportUpdate(target_object);
					VisualEditor.refreshView();
				});
				c1.dataset.itemref=itemref;
				c2.dataset.itemref=itemref;
				sheet.appendChild(c1);
				sheet.appendChild(c2);
				break;
			}
			case "frame":
			{
				target_object.subItems.forEach((socket)=>{
					//console.log(socket);
					if(socket.connections.length>0)
					{
						let knownLines = [];
						let socketLine = document.createElement("div");
						socketLine.dataset.itemref = itemref;
						let sname = document.createElement("span");
						sname.dataset.itemref = itemref;
						sname.append("🔌" + (socket.slot+1).toString());
						socketLine.appendChild(sname);
						socket.connections.forEach((conn)=>{
							if(!knownLines.find((sl)=>sl==conn.parent))
							{
								knownLines.push(conn.parent);
								let badge = this.createLineBadge(conn.parent);
								badge.dataset.itemref = itemref;
								socketLine.appendChild(badge);
							}
						});
						sheet.appendChild(socketLine);
					}
				});
				break;
			}
		}

		
		let el = null;
			while(el = tpl.firstElementChild)
			{
				VisualEditor.propSheetContainer.appendChild(el);
			}
	}
	

    static reportUpdate(target_object)
    {
        let safelbl = target_object.getFullName(VisualEditor.ITEM_REF_SEPARATOR);
        let node = VisualEditor.treeViewContainer.querySelector("li[data-itemref=\""+safelbl+"\"]");
        if(node)
        {
            VisualEditor.buildTree(node,target_object,true);
        }
    }
	static createLineBadge(line, passive = false)
	{
			let badge = document.createElement("div");
			badge.classList.add("line_badge");
			badge.append(" ");
			badge.style.borderTopColor = line.colour1;
			badge.style.borderBottomColor = line.colour2;
			badge.dataset.lineName = line.name;
			if(!passive)
			{
				
				badge.addEventListener("click",(e)=>{
					VisualEditor.selectLine(e.target.dataset.lineName);
				});
				badge.addEventListener("mouseover",(e)=>{
                    VisualEditor.currentHightlight = [line];
                    VisualEditor.refreshView();
				});
			}
			return badge;
	}
	static buildTree(target_node, target_object, replace = false)
	{
		let styles = {
			"location":"🏢\\00FE0F",
			"rack":"🗄\\00FE0F",
			"frame":"🖥️\\00FE0F",
			"socket":"🔌\\00FE0F",
			"line":"🚇\\00FE0F",
			"patch":"🔗\\00FE0F",
			"map":"🏙\\00FE0F",
			"linemap":"🗺\\00FE0F"
		};
		let safelbl = target_object.getFullName(VisualEditor.ITEM_REF_SEPARATOR);
		let tpl = VisualEditor.treeItemTemplate.content.cloneNode(true);
		let item_label = tpl.querySelector(".tree_item_name");
		let toolbox = tpl.querySelector(".tool_buttons");
		item_label.append(target_object.getLabel());
		item_label.dataset.itemref = safelbl;
		if(target_object.collapseView)
		{
			item_label.classList.add("tree_item_hidden");
		}
		toolbox.dataset.itemref = safelbl;
		
		let eye = document.createElement("a");
		eye.append(target_object.collapseView ? "🕶️" : "👁️");
		eye.addEventListener("click", (e)=>{
			target_object.toggleCollapseView();
			VisualEditor.reportUpdate(target_object);
		});
		eye.dataset.itemref= safelbl;
		toolbox.appendChild(eye);

		if(target_object.type == "line")
		{
			let badge = this.createLineBadge(target_object);
			badge.dataset.itemref = safelbl;
			tpl.querySelector(".tree_item_name").appendChild(badge);
		}
		let li = tpl.querySelector(".tree_item");
		li.style.listStyleType = '"├' + styles[target_object.type] + '"';
		li.dataset.itemref = safelbl;
        li.addEventListener("click",(e)=>{
            console.log(e);
            console.log(e.target.nodeName);
            let lbl = e.target.querySelector(".treetoggle");
            // collapse toggle on clicking the markers
            if(lbl && e.target.nodeName == "LI")
            {
                lbl.checked = !lbl.checked;
                e.stopPropagation();
            }
            // else do whatever one normally does on clicking a specific entry
            // #TODO: selecting items in the main display
            else
            {
                let address = e.target.dataset.itemref.split(VisualEditor.ITEM_REF_SEPARATOR);
                let domain = address.shift();
                console.log(address);
                let item = null;
                switch(domain)
                {
                    case "Equipment":
                        {
                            item = VisualEditor.fixedMap.find(...address);
                            break;
                        }
                    case "Lines":
                        {
                            item = VisualEditor.lineMap.find(...address);
                            break;
                        }
                }
                console.log(item);
                if(item)
                {
					if(e.ctrlKey)
					{
						
                    VisualEditor.currentSelection.add([item], true);
					}
					else
					{
						
                    VisualEditor.currentSelection.set([item], true);
					}
                    VisualEditor.refreshView();
                }
            }
            
        });
        tpl.querySelector(".tree_item").addEventListener("mouseover", (e)=>{
            let identifier = e.target.dataset.itemref;
            let address = identifier.split(VisualEditor.ITEM_REF_SEPARATOR);
                let domain = address.shift();
                console.log(address);
                let item = null;
                switch(domain)
                {
                    case "Equipment":
                        {
                            item = VisualEditor.fixedMap.find(...address);
                            break;
                        }
                    case "Lines":
                        {
                            item = VisualEditor.lineMap.find(...address);
                            break;
                        }
                }
                console.log(item);
                if(item)
                {
                    VisualEditor.currentHightlight = [item];
                    VisualEditor.refreshView();
                }


        });

		tpl.querySelector(".treetoggle").id = safelbl;
		//tpl.querySelector(".toggle_label").htmlFor = safelbl;
		if(target_object.subItems.length > 0 )
		{
			let subs = document.createElement("ul");
			subs.dataset.itemref = safelbl;
			target_object.subItems.forEach((sub)=>{
				this.buildTree(subs, sub);
			});
			li.append(subs);
		}
        if(replace)
        {
            let collapsestate=!!target_node.querySelector("input[type=\"checkbox\"")?.checked;
            tpl.firstElementChild.querySelector("input[type=\"checkbox\"").checked = collapsestate;
            target_node.replaceWith( tpl.firstElementChild);
        }
        else
        {
            target_node.appendChild(tpl.firstElementChild);
        }
	}

	static setModePointer()
	{
		VisualEditor.editMode = this.EDIT_MODES.POINTER;
        VisualEditor.updateCursor();
	}
	static setModeWire()
	{
		VisualEditor.editMode = this.EDIT_MODES.WIRE;
        VisualEditor.updateCursor();
	}

	static getCursorPointerMode()
	{
		let cursor = "auto";
		
			if(VisualEditor.currentHightlight[0]?.type == "location")
			{
				cursor = "move";
			}

		return cursor;
	}

	static getCursorWireMode()
	{
		let cursor = "alias";
		let currentHover = VisualEditor.currentHightlight.length > 0 ? VisualEditor.currentHightlight[0] : null;
		let currentHoverSocket = currentHover && currentHover.type == "socket" ? currentHover : null;
		let currentHoverWire = currentHover && currentHover.type == "patch" ? currentHover : null;
		let currentSelected = VisualEditor.currentSelection.selection.length > 0 ? VisualEditor.currentSelection.selection[0] : null;
		let currentWire = currentSelected && currentSelected.type == "patch" ? currentSelected : null;
		if(VisualEditor.subMode == this.SUB_MODES.WIRE_ADD || VisualEditor.subMode == this.SUB_MODES.WIRE_MOVE)
		{
			if(currentHoverSocket && !currentHoverSocket.canAdd(currentWire))
			{
				cursor = "not-allowed";
			}
			else
			{
				cursor = "copy";
			}
			
		}
		if(VisualEditor.subMode == this.SUB_MODES.WIRE_SELECTED)
		{
			if(currentHoverWire)
			{
				cursor = "alias";
			}
			else if(currentHoverSocket)
			{
				if(VisualEditor.shift)
				{
					if(currentHoverSocket.canStart(currentWire))
					{
						cursor = "copy";
					}
					else
					{
						cursor = "not-allowed";
					}
				}
				else
				{
					if(currentHoverSocket.canMove(currentWire))
					{
						cursor = "alias";
					}
					else
					{
						cursor = "not-allowed";
					}

				}
			}
		}
		return cursor;
	}

	static getDefaultCursor()
	{
		// console.log(VisualEditor.editMode);
		switch(VisualEditor.editMode)
		{
			case VisualEditor.EDIT_MODES.POINTER:
			{
				return this.getCursorPointerMode();
			}
			case VisualEditor.EDIT_MODES.WIRE:
			{
				return this.getCursorWireMode();
			}
		}
	}

	static updateCursor()
	{
		let def_cursor = this.getDefaultCursor();
		VisualEditor.mouseArea.style.cursor = def_cursor;

	}

	static handleWireMode(x, y, dbl)
	{
		let results = VisualEditor.getMouseHits(x, y, false);
		results = results.filter((item)=>item.selectionOrder == 4 || item.selectionOrder == 5);
		if(results.length < 1)
		{
			console.log("no wires or sockets picked");
			return;
		}
		// if currently moving a wire, and a socket is clicked, connect the wire to the socket and stop processing
		if(VisualEditor.currentMoving && VisualEditor.currentMoving.type == "socket" &&  results[0]?.type == "socket")
		{
			results[0].takeFrom(VisualEditor.currentMoving, VisualEditor.currentMoving.connections[0]);
			VisualEditor.currentMoving = null;
			VisualEditor.currentSelection.clear();
			VisualEditor.refreshView();
			VisualEditor.subMode = VisualEditor.SUB_MODES.NONE;
			return;
		}

		console.log( results[0]?.type);
		
		console.log(VisualEditor.currentSingleType, " +++ ", results[0]?.type);

		// if a wire has been selected and a socket is clicked
		// start moving the wire connected to that socket (and any matching)
		if(VisualEditor.subMode == VisualEditor.SUB_MODES.WIRE_SELECTED && results[0]?.type == "socket")
		{
			let fromSocket = results[0];
			let fromLine =VisualEditor.currentSingleItem;
			if(!fromSocket.canMove(fromLine))
			{
				console.log("selected socket is not one of the ends");
				return;
			}
			console.log("ready to wire!");
			let mSocket = new VisualSocket(VisualEditor.fixedMap, "mousemove");
			// temp patch to make the fake socket match the mouse exactly
			VisualEditor.currentMovingX=-1*(DIM_FRAME_SIDES + 5);
			VisualEditor.currentMovingY=-2;
			if(VisualEditor.shift)
			{
				if(!fromSocket.canStart(fromLine))
				{
					console.log("can't add a new wire from here");
					return;
				}
				let newpatch = new VisualPatch(fromLine.parent, fromLine.parent.getNextSlot());
				newpatch.from = fromSocket;
				fromSocket.connect(newpatch);
				newpatch.to = mSocket;
				mSocket.connect(newpatch);
				fromLine.parent.addItem(newpatch);
                VisualEditor.reportUpdate(fromLine.parent);
                
				VisualEditor.subMode = this.SUB_MODES.WIRE_ADD;
			}
			else
			{
				mSocket.takeFrom(fromSocket, fromLine);
				VisualEditor.subMode = this.SUB_MODES.WIRE_MOVE;
			}
			
			VisualEditor.currentMoving = mSocket;
			
			VisualEditor.redrawSelection();
			return;
		}

		// else only wires are of interest and should pop out over sockets

		results = results.filter((item)=>item.selectionOrder == 4); // #TODO: remove the hardcode

		// advance depth to allow clickthrough selection if multiple items are under the mouse			
		VisualEditor.currentDepth++;
		if(VisualEditor.currentDepth >= results.length)
		{
			VisualEditor.currentDepth = 0;
		}
		// if a wire is clicked go for it
		if(results[VisualEditor.currentDepth]?.type == "patch")
		{
			VisualEditor.currentSelection.set([results[VisualEditor.currentDepth]])
			console.log("wire selected!");		
			VisualEditor.subMode = VisualEditor.SUB_MODES.WIRE_SELECTED;
			VisualEditor.redrawSelection();

			return;
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
		VisualEditor.currentHightlight = [];
		let results = VisualEditor.getMouseHits(x, y, false);
		results = results.filter((item)=>item.selectionOrder == 4 || item.selectionOrder == 5);
		if(results && results.length>0)
		{
			let issocket = results[0].type == "socket";
			if((issocket && (VisualEditor.currentMoving || VisualEditor.currentSingleType == "patch")))
			{
				VisualEditor.currentHightlight = results;
			}
			else
			{
				results = results.filter((item)=>item.selectionOrder == 4 );
				let iswire = false;
				if(results.length>0)
				{
					iswire = results[0].type == "patch";
				}
				if(!VisualEditor.currentMoving && iswire)
				{
					VisualEditor.currentHightlight = results;
				}
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
		if(VisualEditor.currentHightlight[0]?.type == "location")
		{
			console.log("picked up", VisualEditor.currentHightlight[0]);
			VisualEditor.currentMoving = VisualEditor.currentHightlight[0];
			VisualEditor.currentMovingX = VisualEditor.currentMoving.x - x;
			VisualEditor.currentMovingY = VisualEditor.currentMoving.y - y;
		}
		VisualEditor.updateCursor();
		
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
		
        VisualEditor.updateCursor();
		
		let currentlabel = "";
		let currentrect = [];
		
			
		
		

		
		window.fiber.current = currentlabel;
	window.fiber.selection = currentrect;

	}
}

