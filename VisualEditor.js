/**
 * Manages logic related to item selection.
 */
class VisualEditorSelection
{
    /**
     * This contains the actual selected items.
     */
	selection = [];
    /**
     * Creates a new selection object.
     */
	construct()
	{
		this.selection = [];
	}
    /**
     * Adds items to the selection.
     * @param {Array} items - items to be added 
     * @param {boolean} fireEvent - fires the SelectionChange event in the editor. 
     */
	add(items, fireEvent = true)
	{
        // first, remove the items to be added in case any are already in the selection
        // explicitly do not fire the event
		this.remove(items, false);
        // add the items to the array
		this.selection.push(...items);
        // fire the event if requested
		if(fireEvent)
			VisualEditor.triggerSelectionChange();
    }
    /**
     * Removes items from the selection.
     * @param {Array} items - Items to be removed.
     * @param {boolean} fireEvent - fires the SelectionChange event in the editor.
     */
	remove(items, fireEvent = true)
	{
        // exclude items to be removed from the selection and set the new selection
		this.selection = this.selection.filter(item=>!items.includes(item));
        // fire the event if requested
		if(fireEvent)
			VisualEditor.triggerSelectionChange();
    }
    /**
     * Empties the selection.
     * @param {boolean} fireEvent - fires the SelectionChange event in the editor.
     */
	clear(fireEvent = true)
	{
		this.selection = [];
        // fire the event if requested.
		if(fireEvent)
			VisualEditor.triggerSelectionChange();
	}
    /**
     * Replaces the selection with the given items.
     * @param {Array} items - Items for the selection to contain.
     * @param {boolean} fireEvent - fires the SelectionChange event in the editor.
     */
	set(items, fireEvent = true)
	{
        // empty out the selection
		this.clear(false);
        // add the new items
		this.add(items, false);
        // fire the event if requested.
		if(fireEvent)
			VisualEditor.triggerSelectionChange();
    }
}

class VisualEditor
{
    /**
     * Main edit modes.
     */
	static EDIT_MODES = {POINTER: 0, WIRE: 1, LINK: 2};
    /**
     * Submodes applicable to main edit modes.
     */
	static SUB_MODES = {NONE: 0, 
		WIRE_MOVE: 1, WIRE_ADD: 2, WIRE_REMOVE: 3, WIRE_SELECTED: 4, WIRE_LINE_SELECT: 5,
		LINK_END: 6
	};
	/**
     * Default separator for full item references.
     */
	static ITEM_REF_SEPARATOR = "/";
    /**
     * Current edit mode.
     */
	static editMode = this.EDIT_MODES.POINTER;
    /**
     * Current submode.
     */
	static subMode = this.SUB_MODES.NONE;
	
	/**
     * Indicates whether the Ctrl key is currently down.
     */
	static ctrl = false;
	/**
     * Indicates whether the Shift key is currently down.
     */
	static shift = false;
    /**
     * Indicates whether the mouse button is currently down.
     */
	static mouseDownNow = false;
	static mouseDownPrev = false;
    /**
     * Keeps track of the item currently selected out of multiple
     * under the mouse.
     */
	static currentDepth = 0;
    /**
     * Keeps track of currently selected objects in the editor.
     */
	static currentSelection = new VisualEditorSelection();
    /**
     * Keeps track of currently highlighted (for example, by hovering) objects in the editor.
     */
	static currentHightlight = [];
    /**
     * If exactly one item is selected, contains the item.
     */
	static currentSingleItem = null;
    /**
     * If exactly one item is selected, contains the item's type.
     */
	static currentSingleType = "";
    /**
     * Contains an object currently being moved by the mouse.
     */
	static currentMoving = null;
    /**
     * X offset of the moved item, used to align the item to the mouse.
     */
	static currentMovingX = 0;
    /**
     * Y offset of the moved item, used to align the item to the mouse.
     */
	static currentMovingY = 0;
	
    /**
     * An object containing all "fixed" hardware, starting with Locations.
     */
	static fixedMap = null;
    /**
     * An object containing all "movable" hardware, starting with Lines.
     */
	static lineMap = null;
    /**
     * An object containing all hardware components available for use.
     */
	static inventory = null;
    /**
     * A canvas used for rendering the items in the visual view.
     */
	static mapLayer = null;
    /**
     * A canvas used for rendering highlight and selection outlines in the visual view.
     */
	static highlightLayer = null;
    /**
     * A HTML element where the tree view will be displayed and updated.
     */
    static treeViewContainer = null;
    /**
     * A HTML element where item property sheets will be displayed.
     */
	static propSheetContainer = null;
    /**
     * A HTML element containing the visual view.
     */
    static mouseArea = null;
    /**
     * A HTML element containing the toolbar buttons.
     */
    static toolBar = null;
    /**
     * A reference to an HTML template for a single tree view item.
     */
	static treeItemTemplate = null;
    /**
     * A reference to an HTML template for an item property sheet.
     */
	static itemPropSheetTemplate = null;
	/**
	 * A reference to an HTML <dialog> for creating a new line.
	 */
	static newLineDialogue = null;
	/**
	 * A reference to an HTML <dialog> for adding frames to a rack.
	 */
	static addFrameDialogue = null;
	/**
	 * Contains the data: URL for the frame pre-render.
	 */
	static framePreRenderSrc ="";

	static frameTypeRegistry = {};

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
		results = results.filter(box=>box.item.testHit(x, y) && !box.item.collapseView);
		results.sort((a, b)=>b.level-a.level);
		if(results && onlyTopLevel)
		{
			results = results.filter(box=>box.level == results[0].level);	
		}
		let hits = [];
		results.forEach(box=>hits.push(box.item));
		return hits;
	}
    /**
     * Fetches all individual entries in the tree view pane.
     * @returns {Array} - an array (possibly empty) of all items in the tree view pane.
     */
    static getTreeItems()
    {
        return this.treeViewContainer ? this.treeViewContainer.querySelectorAll("span.tree_item_name") : [];
    }
	/**
	 * Loads hardware inventory (frame templates, connectors etc)
	 * @param {*} inventory 
	 */
	static loadInventory(inventory)
	{
		VisualEditor.inventory = inventory;
		//console.log(VisualEditor.inventory.subItems);
		let frames = VisualEditor.inventory.subItems.filter(vi=>vi.type=="frame_tpl");
		//console.log(frames);
		// render all frame types into an image for dialog boxes
		// #TODO use these prerenders in the interface
		let framerenders = document.createElement("canvas");
		framerenders.width = DIM_FRAME_WIDTH;
		framerenders.height=DIM_FRAME_HEIGHT * (frames.length)
		framerenders.id="framelist";
		let ctx1 = framerenders.getContext("2d");
		for(let i=0;i<frames.length;i++)
		{
			let f = new VisualFrame(inventory, " ");
			f.label =" ";
			f.frametype=frames[i].name;
			f.commit(VisualEditor);
			//f.updateSize();
			f.cY=DIM_FRAME_HEIGHT *i-2;
			f.cX=(-1 * DIM_FRAME_SIDES);
			f.subItems.forEach((sub)=>{sub.updatePosition()});
			f.drawTop(ctx1);
			//console.log(f);
			VisualEditor.frameTypeRegistry[frames[i].name] = {"index": i, "desc": frames[i].label};
		}
		VisualEditor.framePreRenderSrc = framerenders.toDataURL("png");
		//VisualEditor.addFrameDialogue.querySelector("#framelist").replaceWith(framerenders);
	}

	static generateFramePreviewSprite(index, tagname="div")
	{
		let el = document.createElement(tagname);
		el.style.backgroundImage="url(" + VisualEditor.framePreRenderSrc + ")";
		el.style.width = DIM_FRAME_WIDTH+"px";
		el.style.height= DIM_FRAME_HEIGHT+"px";
		el.style.position="relative";
		el.style.backgroundPositionX=0;
		el.style.backgroundPositionY= index * -1 * DIM_FRAME_HEIGHT+"px";
		return el;
	}

    /**
     * Refreshes the highlight and selection outlines in both the visual view and the tree view.
     */
	static redrawSelection()
	{
        // draw on the layer used for selections
		const ctx = VisualEditor.highlightLayer;
		ctx.clearRect(0,0,5000,5000);
        // line styles for highlights
		let selectionOutline = {
			strokeStyle : "rgb(255 0 0 / 80%)",
			lineWidth: 5
		};
		let highlighter1 = {
			strokeStyle : "red",
			lineWidth: 3
		};
		let highlighter2 = {
			strokeStyle :"rgb(255 0 0 / 30%)",
			lineWidth: 3
		};
        // process selection
        let itemIDs = [];
		if(VisualEditor.currentSelection)
		{
			VisualEditor.currentSelection.selection.forEach((box)=>{
                // render the item on this layer to make it more visible
                box.drawTop(ctx);
                // render this item's defined highlight (outline of item and possibly related items)
                box.drawHighlight(ctx, selectionOutline);
                // collect the item's full name to update the tree view
                itemIDs.push(box.getFullName(VisualEditor.ITEM_REF_SEPARATOR));
            });
            // update the tree view with the collected items
            VisualEditor.getTreeItems().forEach((item)=>{
                // get a given entry's item reference
                let objid = item.dataset.itemref;
                // mark as selected if found,
                if(itemIDs.find(id=>id==objid))
                {
                    item.classList.add("selected");
                }
                // remove marking otherwise
                else
                {
                    item.classList.remove("selected");
                }
            });
		}
        // process highlights
        itemIDs = [];
		if(VisualEditor.currentHightlight)
		{
			VisualEditor.currentHightlight.forEach((box)=>{
                // render this item's defined highlight (outline of item and possibly related items)
                box.drawHighlight(ctx, highlighter1);
                // collect the item's full name to update the tree view
                itemIDs.push(box.getFullName(VisualEditor.ITEM_REF_SEPARATOR));
            });
            // update the tree view with the collected items
            VisualEditor.getTreeItems().forEach((item)=>{
                // get a given entry's item reference
                let objid = item.dataset.itemref;
                // mark as highlighted if found,
                if(itemIDs.find(id=>id==objid))
                {
                    item.classList.add("highlighted");
                }
                // remove marking otherwise
                else
                {
                    item.classList.remove("highlighted");
                }
            });
		}
	}
    /**
     * Performs a full redraw of all items on the visual view.
     */
	static redrawItems()
	{
        // use the object/item layer
		const ctx = VisualEditor.mapLayer;
		ctx.clearRect(0,0,5000,5000);
		VisualEditor.drawCallCount=0;
        // draw the "fixed" items (locations, racks etc)
		VisualEditor.fixedMap.draw(ctx);
		//console.log("Equipment draw calls: " + VisualEditor.drawCallCount);
		VisualEditor.drawCallCount=0;
        // draw the "movable" items (cabling)
		VisualEditor.lineMap.draw(ctx);
		//console.log("Linemap draw calls: " + VisualEditor.drawCallCount);
		VisualEditor.drawCallCount=0;
        // draw collapsed items
		VisualEditor.fixedMap.drawCollapsed(ctx);
		//console.log("Collapsed draw calls: " + VisualEditor.drawCallCount);
		VisualEditor.drawCallCount=0;
	}
    /**
     * Performs a complete refresh of all displays and item properties.
     */
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
    /**
     * Sets the current selection to a specific @type {VisualLine}.
     * @param {string} name - name of the line to be selected. Silently fails if line not found. 
     */
	static selectLine(name)
	{
		const line = VisualEditor.lineMap.find(name);
        // if the line is found, select it
		if(line)
		{
			VisualEditor.currentSelection.set([line]);
			VisualEditor.redrawSelection();
		}
        // else complain, but very quietly
        else
        {
            console.log("Line <%s> was not found when trying to select it.", name);
        }
	}
    /**
     * Performs any tasks relevant to a selection change, and fires the event.
     */
	static triggerSelectionChange()
	{
		// for contextual actions requiring a specific item type to be selected
		if(VisualEditor.currentSelection.selection.length> 0)
		{
			//console.log("non-empty selection made");
            // if exactly one item is selected, set the currentSingle* properties
			if(VisualEditor.currentSelection.selection.length === 1)
			{
				VisualEditor.currentSingleItem = VisualEditor.currentSelection.selection[0];
				VisualEditor.currentSingleType = VisualEditor.currentSingleItem.type;
				//console.log("exactly one item of type <" + VisualEditor.currentSingleType + "> picked");
				this.updateContextTools();
			}
            // otherwise, clear the currentSingle* properties
			else
			{	
			    VisualEditor.currentSingleItem = null;
			    VisualEditor.currentSingleType = "";
			}
		}
        // also clear the currentSingle* properties
		else
		{
			//console.log("selection is empty now");
			VisualEditor.currentSingleItem = null;
			VisualEditor.currentSingleType = "";
		}
        // run the user-replaceable function (#TODO: proper event handling? does JS do that?)
		this.selectionChange();
	}

	static updateContextTools()
	{
		VisualEditor.toolBar.querySelector("#add_line").disabled = VisualEditor.currentSingleType != "socket";
		VisualEditor.toolBar.querySelector("#add_frame").disabled = VisualEditor.currentSingleType != "rack";
			
	}

    /**
     * This is fired if the SelectionChange event is triggered - replace with event handler.
     */
	static selectionChange = function()
	{
		
	};
    /**
     * Builds a property sheet for a given item, and inserts it into the sheet container.
     * @param {VisualItem} target_object - the subject of the property sheet.
     */
	static buildPropSheet(target_object, rebuild = false)
	{
        // load the template
		let tpl = VisualEditor.itemPropSheetTemplate.content.cloneNode(true);
        // this reference will be stuck into every single HTML element downstream, for convenience
		let itemref = target_object.getFullName("/");
		tpl.firstElementChild.dataset.itemref=itemref;
        // the item badge styles itself as needed with CSS
		let item_badge = tpl.querySelector(".item_badge");
		item_badge.dataset.itemref = itemref;
		item_badge.dataset.itemtype = target_object.type;
        // the item title is actually an <input>, mimicking as regular text
        // this allows for fancy editing on click effect
		let item_label = tpl.querySelector(".item_title");
		item_label.dataset.itemref = itemref;
		item_label.dataset.itemtype = target_object.type;
        // while "inactive", displays either the label or the default name
		item_label.value = target_object.getLabel();
        // set this to the name to show the default if the text field is erased fully
        item_label.placeholder  = target_object.name;
        // when the title is selected, clicked, tabbed to etc, triggering editing
        item_label.addEventListener("focus",(e)=>
        {
            // swap out the value for the actual label, pre-fill with default if empty
            item_label.value = target_object.label == "" ? target_object.getLabel() : target_object.label;
            // activate editing - the CSS ensures the control is clearly a textbox in this state
            item_label.readOnly = false;
        });
        // extra QoL - pressing Enter also saves the value
        item_label.addEventListener("keydown",(e)=>
        {
            if(e.code == "Enter")
            {
                item_label.blur();
            }
        });
        // when done editing, navigate away from the textbox or hit Enter 
        item_label.addEventListener("blur",(e)=>
        {
            // ensure a clean value without stray spaces gets entered
            target_object.label = item_label.value.trim();
            // "mask" the input as a regular text label again
            item_label.readOnly = true;
            // reset the displayed text to the proper labeling as defined by the item
            item_label.value = target_object.getLabel();
            // notify the editor that an item was changed
            VisualEditor.reportUpdate(target_object);
            // refresh everything (#TODO: is this really needed for one tiny label?)
            VisualEditor.refreshView();
        });
        // get the reference to the container for any item type specific controls
		let sheet = tpl.querySelector(".item_properties");
		sheet.dataset.itemref = itemref;
		switch(target_object.type)
		{
			case "location":
			{
                // add a toggleagle checkbox to set the location's compact state
				let toggle = document.createElement("input");
				toggle.type = "checkbox";
                // make sure the checkbox state reflects current state
				toggle.checked = target_object.collapseState;
                // event handler for the toggle
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
                // label for the checbox
				let lbl = document.createElement("label");
				lbl.append("Compact view");
				lbl.dataset.itemref = itemref;
				lbl.htmlFor = itemref;
				sheet.appendChild(lbl);
				break;
			}
			case "patch":
			{
                // add a colour-coded line badge that selects the parent line when clicked
				let badge = this.createLineBadge(target_object.parent);
				badge.dataset.lineName = target_object.parent.name;
				badge.addEventListener("click",(e)=>{
					VisualEditor.selectLine(e.target.dataset.lineName);
				});
				sheet.appendChild(badge);
				break;
			}
			case "rack":
			{
				let previousSlot = -1;
				target_object.subItems.forEach((f)=>{
					if(f.slot-previousSlot>1)
					{
						let start =previousSlot+1;
						let end = f.slot-1
						let addbutton = document.createElement("button");
						addbutton.append("Insert frame");
						addbutton.addEventListener("click",(e)=>{
							VisualEditor.showAddFrameDlg(start+1, end+1,itemref);
						});
						sheet.appendChild(addbutton);
					}
					let idx = VisualEditor.frameTypeRegistry[f.frametype]['index'];
					let frame = VisualEditor.generateFramePreviewSprite(idx);
					frame.dataset.itemref=itemref;
					sheet.appendChild(frame);
					previousSlot=f.slot;
				});
				let start =previousSlot+1;
						let addbutton = document.createElement("button");
						addbutton.append("Insert frame");
						addbutton.addEventListener("click",(e)=>{
							VisualEditor.showAddFrameDlg(start+1, 100,itemref);
						});
						sheet.appendChild(addbutton);
				break;
			}
			case "line":
			{
				let start_lbl = document.createElement("div");
				let end_lbl = document.createElement("div");
				if(target_object.doContinuity)
				{
					start_lbl.append(this.createHotLabel(target_object.start));
					start_lbl.append(" @ [");
					start_lbl.append(this.createHotLabel(target_object.start.parent));
					start_lbl.append("]");
					end_lbl.append(this.createHotLabel(target_object.end));
					end_lbl.append(" @ [");
					end_lbl.append(this.createHotLabel(target_object.end.parent));
					end_lbl.append("]");
					sheet.appendChild(start_lbl);
					let flipper = document.createElement("button");
					flipper.append("▲swap▼");
					flipper.addEventListener("click",(e)=>{
						console.log(target_object);
						target_object.reverse();
						VisualEditor.reportUpdate(target_object);
					});
					sheet.appendChild(flipper);

				}
				else if(target_object.name=="looselinks")
				{
					end_lbl.append("This contains any links not assigned to a line.")
				}
				sheet.appendChild(end_lbl);
                // two colour pickers for the line's 2 colours
                // <input type="color"> does NOT support named colours
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
                // list any sockets with connections on them
				target_object.subItems.forEach((socket)=>{
					if(socket.connections.length>0)
					{
                        // keep a list of already seen lines on this socket
						let knownLines = [];
						let socketLine = document.createElement("div");
						socketLine.dataset.itemref = itemref;
						let sname = document.createElement("span");
						sname.dataset.itemref = itemref;
						// display the name of the socket 
                        sname.append("🔌" + socket.getLabel());
						socketLine.appendChild(sname);
                        // followed by one or more line badges found in the connections
						socket.connections.forEach((conn)=>{
                            // only go for badges not seen yet
							if(!knownLines.find((sl)=>sl==conn.parent))
							{
								knownLines.push(conn.parent);
								let badge = this.createLineBadge(conn.parent);
								badge.dataset.itemref = itemref;
								socketLine.appendChild(badge);
								if(conn.parent.doContinuity)
								{
									if(socket!=conn.parent.start)
									{
										if(socket==conn.parent.end)
										{
											socketLine.append(" <-- ");
										}
										let s=conn.parent.start;
										socketLine.append(s.getLabel() + " @ [" + s.parent.getLabel()+"]");		
									}
									else
									{
										socketLine.append(" --> ");
									}
									if(socket!=conn.parent.end)
									{
										if(socket!=conn.parent.start)
										{
											socketLine.append(" --> ");
										}
										let s=conn.parent.end;
										socketLine.append(s.getLabel() + " @ [" + s.parent.getLabel()+"]");
									}
								}
								else
								{
									let isfrom=conn.from==socket;
									let otherend = isfrom?conn.to:conn.from;
									if(otherend)
									{
										socketLine.append(" "+(isfrom?"-->":"<--")+" "+otherend.getLabel() + " @ [" + otherend.parent.getLabel()+"]");
									}
								}
							}
						});
						sheet.appendChild(socketLine);
					}
				});
				break;
			}
		}

		// now shove all this stuff into the container
		if(rebuild)
		{
			VisualEditor.propSheetContainer.querySelectorAll(".infoblock").forEach((b)=>{
				if(b.dataset.itemref == itemref)
				{
					b.replaceWith(tpl.firstElementChild);
				}
			});
		}
        else
        {
            VisualEditor.propSheetContainer.appendChild(tpl.firstElementChild);
        }
	}
	static checkIfCanCreateGroup()
	{
		const sel = VisualEditor.currentSelection.selection;
		if(sel.length==0)
			return;
		for(let i=0;i<sel.length;i++)
		{
			if(sel[i].type!="patch")
				return false;
			if(sel[i].parent.name!="looseLinks")
				return false;
		}
		let sheet =  VisualEditor.propSheetContainer;
		let addbutton = document.createElement("button");
						addbutton.append("Create group");
						addbutton.addEventListener("click",(e)=>{
							let nn = VisualEditor.lineMap.getNextPrefixedSlot("g_");
							let line = new VisualLine(VisualEditor.lineMap, "g_"+nn);
							line.doContinuity=false;
							line.label="Group "+nn;
							line.subtype="linkgroup";
							for(let i=0;i<sel.length;i++)
							{
								sel[i].name=line.getNextSlot();
								sel[i].parent=line;
								VisualEditor.lineMap.looseLinks.removeItem(sel[i]);
								line.addItem(sel[i]);
							}
							VisualEditor.lineMap.addItem(line);
							VisualEditor.currentSelection.set([line]);
							VisualEditor.reportUpdate(VisualEditor.lineMap);
							VisualEditor.redrawSelection();
						});
						sheet.appendChild(addbutton);
		return true;
	}
	static checkIfCanAddToGroup()
	{
		const sel = VisualEditor.currentSelection.selection;
		let g0=null;
		let adds = 0;
		for(let i=0;i<sel.length;i++)
		{
			if(sel[i].type!="patch")
				return false;
			if(sel[i].parent.name=="looseLinks")
			{
				adds++;
				continue;
			}
			if(sel[i].parent.doContinuity)
				return false;
			if(!g0)
				g0=sel[i].parent;
			if(g0!=sel[i].parent)
				return false;
		}
		if(!g0)
			return false;
		if(adds==0)
			return false;
		let sheet =  VisualEditor.propSheetContainer;
		let addbutton = document.createElement("button");
						addbutton.append("Add to "+g0.getLabel());
						addbutton.addEventListener("click",(e)=>{
							sel.forEach((l)=>{
								if(l.parent == g0)
									return;
								l.name=g0.getNextSlot();
								l.parent=g0;
								VisualEditor.lineMap.looseLinks.removeItem(l);
								g0.addItem(l);
							});
							VisualEditor.reportUpdate(VisualEditor.lineMap);
							VisualEditor.redrawSelection();
							VisualEditor.triggerSelectionChange();
						});
						sheet.appendChild(addbutton);
		return true;

	}
    /**
     * Called when an item has been changed.
     * @param {VisualItem} target_object - the item that has been changed.
     */
    static reportUpdate(target_object)
    {
        let safelbl = target_object.getFullName(VisualEditor.ITEM_REF_SEPARATOR);
        // get the first <li> matching the itemref - shouldn't be more than one anyway
        let node = VisualEditor.treeViewContainer.querySelector("li[data-itemref=\""+safelbl+"\"]");
        if(node)
        {
            // if found, hollow out the <li> and build that item's tree inside of it
            VisualEditor.buildTree(node,target_object,true);
        }
		VisualEditor.buildPropSheet(target_object, true);
    }
    /**
     * Creates a colour-coded badge indicating a specifc line, optionally clickable to select that line.
     * @param {VisualLine} line - the Line to create the badge for.
     * @param {boolean} passive - if true, the badge does not select the line when clicked.
     * @returns 
     */
	static createLineBadge(line, passive = false)
	{
			let badge = document.createElement("div");
			badge.classList.add("line_badge");
			badge.append(" ");
			badge.style.borderTopColor = line.colour1;
			badge.style.borderBottomColor = line.colour2;
			badge.dataset.lineName = line.name;
            // wire it up unless asked not to
			if(!passive)
			{
				// on click, select the line
				badge.addEventListener("click",(e)=>{
					VisualEditor.selectLine(e.target.dataset.lineName);
				});
                // on hover, highlight the line
				badge.addEventListener("mouseover",(e)=>{
                    VisualEditor.currentHightlight = [line];
                    VisualEditor.refreshView();
				});
			}
			return badge;
	}
	/**
	 * Generates a text label that will act as a proxy for the item, highlighting it when hovered
	   and selecting it when clicked. Supports the Ctrl key.
	 * @param {VisualItem} item - the item to link to the label.
	 * @param {string} tagname - the HTML tag name to use for the label, defaults to "span"
	 * @returns The text label as a HTML element.
	 */
	static createHotLabel(item, tagname="span")
	{
		let lbl = document.createElement(tagname);
		lbl.append(item.getLabel());
		lbl.addEventListener("click",(e)=>{
			if(e.ctrlKey)
			{
				VisualEditor.currentSelection.add([item], true);
			}
			else
			{	
				VisualEditor.currentSelection.set([item], true);
			}
			VisualEditor.refreshView();
		});
		lbl.addEventListener("mouseover", (e)=>{
			VisualEditor.currentHightlight = [item];
			VisualEditor.redrawSelection();
		});
		return lbl;
	}

	static find(address)
	{
		let domain = address.shift();
		//console.log(address);
		let item = null;
		// look in either of the current 2 types of items
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
		return item;
	}

    /**
     * Builds a tree view with the object as the root item. The tree is built recursively.
     * The tree is then either inserted or replaces a specified HTML element.
     * @param {HTMLElement} target_node - the HTML element to attach or replace with the tree.
     * @param {VisualItem} target_object - the object to build the tree from.
     * @param {boolean} replace - if true, the targeted HTML element will be replaced with the tree.
     * Otherwise, the tree is appended as a child of the targeted element.
     */
	static buildTree(target_node, target_object, replace = false)
	{
        // this will be added to every HTML element involved for good measure
		let safelbl = target_object.getFullName(VisualEditor.ITEM_REF_SEPARATOR);
        // get the template out
		let tpl = VisualEditor.treeItemTemplate.content.cloneNode(true);
        // this is the item's display name
		let item_label = tpl.querySelector(".tree_item_name");
        // this will contain tool buttons that can pop up on hovering the item in the list
		let toolbox = tpl.querySelector(".tool_buttons");
        // add a line badge if the item is a Line
		if(target_object.type == "line")
		{
			let badge = this.createLineBadge(target_object);
			badge.dataset.itemref = safelbl;
			item_label.appendChild(badge);
		}
		item_label.append(target_object.getLabel());
		item_label.dataset.itemref = safelbl;
        // indicate that this item is hidden from view/collapsed
		if(target_object.collapseView)
		{
			item_label.classList.add("tree_item_hidden");
		}
		toolbox.dataset.itemref = safelbl;
		// "hide/show" tool button
		let eye = document.createElement("a");
		eye.append(target_object.collapseView ? "🕶️" : "👁️");
		eye.addEventListener("click", (e)=>{
			target_object.toggleCollapseView();
			VisualEditor.reportUpdate(target_object);
		});
		eye.dataset.itemref= safelbl;
		toolbox.appendChild(eye);
        // this is the <li> containing this item
		let li = tpl.querySelector(".tree_item");
		li.dataset.itemtype = target_object.type;
		li.dataset.itemsubtype = target_object.subtype;
		li.dataset.itemref = safelbl;
        // the following implements collapsible tree view that behaves more or less like one expects it to
        // black magic fuckery begins here
        li.addEventListener("click",(e)=>{
            let lbl = e.target.querySelector(".treetoggle");
            // collapse toggle on clicking the markers
            // yes, clicking on the list markers specifically
            // counts as clicking on the corresponding <li> nodes
            // so the following runs specifically when
            // 1) a <li> receives a click event
            // 2) said <li> contains a checkbox with the class "treetoggle"
            if(lbl && e.target.nodeName == "LI")
            {
                // toggle a checkbox
                // CSS does the heavy lifting here
                lbl.checked = !lbl.checked;
                // 
                e.stopPropagation();
            }
            // else do whatever one normally does on clicking a specific entry
            else
            {
                // see that's why all these itemrefs are everywhere
                // can't miss one
                let address = e.target.dataset.itemref.split(VisualEditor.ITEM_REF_SEPARATOR);
                // currently the "top" level gets special treatment as those are separate objects
                let item = VisualEditor.find(address);
                //console.log(item);
                // if found, do selection
                // add on Ctrl else select the item as is
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
        // mouseover is way less magical, same code as selection
        // #TODO global editor method to locate item by full address?
        tpl.querySelector(".tree_item").addEventListener("mouseover", (e)=>{
            // find the moused item and higlight it if found
            let identifier = e.target.dataset.itemref;
            let address = identifier.split(VisualEditor.ITEM_REF_SEPARATOR);
            let domain = address.shift();
            //console.log(address);
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
                case "Inventory":
                    {
                        item = VisualEditor.inventory.find(...address);
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
        // set the magic checkbox's id to the itemref as well
		tpl.querySelector(".treetoggle").id = safelbl;
        // recurse if there are items under this item
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
            // this nicely lets the topmost item of a changed item keep its collapse state
            let collapsestate=!!target_node.querySelector("input[type=\"checkbox\"")?.checked;
            tpl.firstElementChild.querySelector("input[type=\"checkbox\"").checked = collapsestate;
            target_node.replaceWith( tpl.firstElementChild);
        }
        // if not replacing just insert the node
        else
        {
            target_node.appendChild(tpl.firstElementChild);
        }
	}

	static showAddFrameDlg(min, max, rackID)
	{
		console.log("loading dlg");
		// only initiate on socket
		if(!VisualEditor.currentSingleItem || VisualEditor.currentSingleType!="rack")
		{
			return;
		}
		VisualEditor.addFrameDialogue.querySelector('#override').checked=false;
		VisualEditor.addFrameDialogue.querySelector('#override').addEventListener("change",function (e){
			if(this.checked)
			{
				VisualEditor.addFrameDialogue.querySelector("#slot").min =1;
				VisualEditor.addFrameDialogue.querySelector("#slot").max =999;
			}
			else
			{
				
				VisualEditor.addFrameDialogue.querySelector("#slot").min =min;
				VisualEditor.addFrameDialogue.querySelector("#slot").max =max;
			}
		});
		VisualEditor.addFrameDialogue.querySelector('#rackref').value = rackID;
		//console.log(rackID);
		VisualEditor.addFrameDialogue.querySelector("#slot").value =min;
		VisualEditor.addFrameDialogue.querySelector("#slot").min =min;
		VisualEditor.addFrameDialogue.querySelector("#slot").max =max;
		let frames = document.createElement("div");
		let names = Object.keys(VisualEditor.frameTypeRegistry);
		let checked = true;
		let list = document.createElement("ul");
		list.id = "framelist";
		names.forEach((fname)=>{
			let idx = VisualEditor.frameTypeRegistry[fname]['index'];
			let flbl = VisualEditor.frameTypeRegistry[fname]['desc'] == "" ? fname :  VisualEditor.frameTypeRegistry[fname]['desc'];
			let img = VisualEditor.generateFramePreviewSprite(idx,"span");
			let lbl = document.createElement("label");
			lbl.htmlFor="frame_opt_" + idx;
			lbl.appendChild(img);
			lbl.append(flbl);
			let row = document.createElement("li");
			let radbtn = document.createElement("input");
			radbtn.value=fname;
			radbtn.type="radio";
			radbtn.name="frameselector";
			radbtn.id="frame_opt_" +idx;
			radbtn.checked = checked;
			if(checked)
			{
				checked = false;
			}
			row.appendChild(radbtn);
			row.appendChild(lbl);
			list.appendChild(row);
		});
		VisualEditor.addFrameDialogue.querySelector("#framelist").replaceWith(list);
		VisualEditor.addFrameDialogue.returnValue ="";
		VisualEditor.addFrameDialogue.showModal();

	}
	static addFrameResult()
	{
		if(VisualEditor.addFrameDialogue.returnValue!="ok")
		{
			return;
		}
		let frame = VisualEditor.addFrameDialogue.querySelector('input[name=frameselector]:checked').value;
		let override = VisualEditor.addFrameDialogue.querySelector('#override').checked;
		let slot = VisualEditor.addFrameDialogue.querySelector('#slot').value;
		let rackID = VisualEditor.addFrameDialogue.querySelector('#rackref').value.split(VisualEditor.ITEM_REF_SEPARATOR);
		//console.log(rackID);
		let rack = VisualEditor.find(rackID);
		if(rack)
		{
			let newframe = new VisualFrame(rack, slot);
			newframe.slot = slot-1;
			newframe.frametype = frame;
			newframe.label=slot;
			newframe.commit(VisualEditor);
			if(override)
			{
				newframe.name=String(rack.getNextSlot()+1);
				rack.freeSlot(slot-1);
			}
			rack.addItem(newframe);
			rack.updateSize();
			rack.updatePosition();
			VisualEditor.reportUpdate(rack);
			VisualEditor.refreshView();
		}
	}

	static createLine()
	{
		console.log("creating line");
		// only initiate on socket
		if(!VisualEditor.currentSingleItem || VisualEditor.currentSingleType!="socket")
		{
			return;
		}
		console.log("actually creating line");
		
		VisualEditor.newLineDialogue.showModal();

	}

	static createLineResult(e)
	{
		console.log("after dlg");
		//console.log(VisualEditor.newLineDialogue.returnValue);
		if(VisualEditor.newLineDialogue.returnValue)
		{
            // make a fake socket to attach the wire to
			let mSocket = new VisualSocket(VisualEditor.fixedMap, "mousemove");
			// temp patch to make the fake socket match the mouse exactly
			VisualEditor.currentMovingX=-1*(DIM_FRAME_SIDES + 5);
			VisualEditor.currentMovingY=-2;
			let fromSocket=VisualEditor.currentSingleItem;
			if(VisualEditor.lineMap.checkName(VisualEditor.newLineDialogue.returnValue))
			{
				return;
			}
			let line = new VisualLine(VisualEditor.lineMap, VisualEditor.newLineDialogue.returnValue);
			let newpatch = new VisualPatch(line, line.getNextSlot());
			newpatch.from = VisualEditor.currentSingleItem;
			fromSocket.connect(newpatch);
			newpatch.to = mSocket;
			mSocket.connect(newpatch);
			line.addItem(newpatch);
			VisualEditor.lineMap.addItem(line);
			VisualEditor.reportUpdate(VisualEditor.lineMap);
			VisualEditor.toolBar.querySelector("#mode_rewire").click();
			VisualEditor.subMode = this.SUB_MODES.WIRE_MOVE;
			// attach the fake socket to the mouse
			VisualEditor.currentMoving = mSocket;
			// refresh
			VisualEditor.redrawSelection();

		}

	}

	//////////////////////////////////////////////////////////////////////////
	///////////////////// EDITOR MODES BELOW /////////////////////////////////
	//////////////////////////////////////////////////////////////////////////



    /**
     * Sets the editor mode to default (selecting and moving items).
     */
	static setModePointer()
	{
		
        VisualEditor.updateCursor();
	}
    /**
     * Sets the editor mode to wiring (moving existing wires and extending lines).
     */
	static setModeWire()
	{
		
        VisualEditor.updateCursor();
	}
    /**
     * Sets the editor mode to wiring (moving existing wires and extending lines).
     */
	static setModeLink()
	{
		VisualEditor.editMode = this.EDIT_MODES.LINK;
        VisualEditor.updateCursor();
	}

	/**
	 * Sets editor mode to specified mode.
	 */
	static setEditorModeHandler(e)
	{
		let mode = e.currentTarget.dataset.mode ?? "";
		let editMode = this.EDIT_MODES.POINTER;
		switch(mode)
		{
			case "wire":
			{
				editMode = this.EDIT_MODES.WIRE;
				break;
			}
			case "link":
			{
				editMode = this.EDIT_MODES.LINK;
				break;
			}
		}
		VisualEditor.setEditorMode(editMode,VisualEditor.SUB_MODES.NONE);
		VisualEditor.toolBar.querySelectorAll(".mode_button").forEach((b)=>{
			if(b.dataset.mode==mode)
			{
				b.classList.add("current_mode");

			}
			else
			{
				b.classList.remove("current_mode");
			}
		});
	}
	/**
	 * Sets editor mode to specified mode.
	 */
	static setEditorMode(mode, submode=-1)
	{
		if(submode!=-1)
		{
			VisualEditor.subMode = submode;
			VisualEditor.editMode = mode;
		}
		else
		{
			VisualEditor.editMode = mode;
		}
        VisualEditor.updateCursor();
	}




    /**
     * Gets the appropriate cursor while in default mode.
     * @returns {string} a CSS name for the cursor.
     */
	static getCursorPointerMode()
	{
		let cursor = "auto";
        // if hovering an empty spot on a location, show move cursor
        if(VisualEditor.currentHightlight[0]?.type == "location")
        {
            cursor = "move";
        }
		return cursor;
	}
    /**
     * Gets the appropriate cursor while in default mode.
     * @returns {string} a CSS name for the cursor.
     */
	static getCursorLinkMode()
	{
		let cursor = "alias";
        // if hovering an empty spot on a location, show move cursor
        if(VisualEditor.currentHightlight[0]?.connections?.length <1 && VisualEditor.subMode == this.SUB_MODES.NONE)
        {
            cursor = "copy";
        }
		if(VisualEditor.currentHightlight[0]?.connections?.length > 1)
		{
			cursor = "not-allowed";
		}
		if(VisualEditor.subMode == this.SUB_MODES.LINK_END && VisualEditor.currentHightlight[0]?.connections?.length>0)
		{
			cursor = "not-allowed";
		}
		return cursor;
	}
    /**
     * Gets the appropriate cursor while in wiring mode.
     * @returns {string} a CSS name for the cursor.
     */
	static getCursorWireMode()
	{
        // default to the "shortcut" style cursor
		let cursor = "alias";
        // figure out what the user is currently hovering
		let currentHover = VisualEditor.currentHightlight.length > 0 ? VisualEditor.currentHightlight[0] : null;
		let currentHoverSocket = currentHover && currentHover.type == "socket" ? currentHover : null;
		let currentHoverWire = currentHover && currentHover.type == "patch" ? currentHover : null;
		let currentSelected = VisualEditor.currentSelection.selection.length > 0 ? VisualEditor.currentSelection.selection[0] : null;
		let currentWire = currentSelected && currentSelected.type == "patch" ? currentSelected : null;
		// if moving/adding a wire, check if hovered item is a socket that can accept the wire
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
        // if a wire has been previously selected, indicate possible actions
		if(VisualEditor.subMode == this.SUB_MODES.WIRE_SELECTED)
		{
            // "normal" cursor if another wire is hovered - user can select that one instead
			if(currentHoverWire)
			{
				cursor = "alias";
			}
			else if(currentHoverSocket)
			{
				if(VisualEditor.shift)
				{
                    // if Shift is pressed and the line can be extended from the currently hovered socket,
                    // indicate this
					if(currentHoverSocket.canStart(currentWire))
					{
						cursor = "copy";
					}
                    // else display 🚫
					else
					{
						cursor = "not-allowed";
					}
				}
				else
				{
                    // if no Shift and current socket can be moved from, show "normal" cursor
					if(currentHoverSocket.canMove(currentWire))
					{
						cursor = "alias";
					}
                    // 🚫 otherwise
					else
					{
						cursor = "not-allowed";
					}

				}
			}
		}
		return cursor;
	}
    /**
     * Gets the appropriate cursor for the current editing mode and state.
     * @returns {string} - the CSS string with the cursor name.
     */
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
			case VisualEditor.EDIT_MODES.LINK:
			{
				return this.getCursorLinkMode();
			}
		}
	}
    /**
     * Gets the cursor and applies it to the visual area.
     */
	static updateCursor()
	{
		let def_cursor = this.getDefaultCursor();
		VisualEditor.mouseArea.style.cursor = def_cursor;

	}
    /**
     * Handles mouse clicks in wiring mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     * @param {boolean} dbl - true if double click
     */
	static handleWireMode(x, y, dbl)
	{
		let results = VisualEditor.getMouseHits(x, y, false);
        // only interested in wires and sockets
		results = results.filter((item)=>item.selectionOrder == 4 || item.selectionOrder == 5);
		// if none are clicked, exit
        if(results.length < 1)
		{
			console.log("no wires or sockets picked");
			return;
		}
		// if currently moving a wire, and a socket is clicked, connect the wire to the socket and exit
		if(VisualEditor.currentMoving && VisualEditor.currentMoving.type == "socket" &&  results[0]?.type == "socket")
		{
			let newlink =VisualEditor.currentMoving.connections[0]
			results[0].takeFrom(VisualEditor.currentMoving, newlink);
            // #HACK! do it properly later.
			newlink.parent.commit(null);
			// reset state 
			VisualEditor.currentMoving = null;
			VisualEditor.currentSelection.set([newlink]);
			VisualEditor.refreshView();
			VisualEditor.subMode = VisualEditor.SUB_MODES.NONE;
			return;
		}

		//console.log( results[0]?.type);
		
		//console.log(VisualEditor.currentSingleType, " +++ ", results[0]?.type);

		// if a wire has been selected and a socket is clicked
		// start moving the wire connected to that socket (and any matching)
		if(VisualEditor.subMode == VisualEditor.SUB_MODES.WIRE_SELECTED && results[0]?.type == "socket")
		{
			let fromSocket = results[0];
			let fromLine =VisualEditor.currentSingleItem;
            // make sure the selected socket actually is connected to the wire
			if(!fromSocket.canMove(fromLine))
			{
				console.warn("selected socket is not one of the ends");
				return;
			}
			//console.log("ready to wire!");
            // make a fake socket to attach the wire to
			let mSocket = new VisualSocket(VisualEditor.fixedMap, "mousemove");
			// temp patch to make the fake socket match the mouse exactly
			VisualEditor.currentMovingX=-1*(DIM_FRAME_SIDES + 5);
			VisualEditor.currentMovingY=-2;
            // if shift is pressed, try adding a new wire from the target socket
			if(VisualEditor.shift)
			{
				if(!fromSocket.canStart(fromLine))
				{
					console.warn("can't add a new wire from here");
					return;
				}
                // create a wire, attach it from the target socket to the fake socket
				let newpatch = new VisualPatch(fromLine.parent, fromLine.parent.getNextSlot());
				newpatch.from = fromSocket;
				fromSocket.connect(newpatch);
				newpatch.to = mSocket;
				mSocket.connect(newpatch);
				fromLine.parent.addItem(newpatch);
                VisualEditor.reportUpdate(fromLine.parent);
                
				VisualEditor.subMode = this.SUB_MODES.WIRE_ADD;
			}
            // else move whatever is attached to the socket
			else
			{
				mSocket.takeFrom(fromSocket, fromLine);
				VisualEditor.subMode = this.SUB_MODES.WIRE_MOVE;
			}
			// attach the fake socket to the mouse
			VisualEditor.currentMoving = mSocket;
			// refresh
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
		// idk what to do here
		else
		{
		}
		
		
		VisualEditor.redrawSelection();

	}
    /**
     * Handles mouse up events in wiring mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     * @returns 
     */
	static handleMUpWireMode(x, y)
	{

	}
    /**
     * Handles mouse downs in wiring mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     */
	static handleMDownWireMode(x, y)
	{

	}
    /**
     * Handles mouse moving in wiring mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     */
	static handleMMoveWireMode(x, y)
	{
		VisualEditor.currentHightlight = [];
		let results = VisualEditor.getMouseHits(x, y, false);
        // see if any wires or sockets are under the mouse
		results = results.filter((item)=>item.selectionOrder == 4 || item.selectionOrder == 5);
		if(results && results.length>0)
		{
			let issocket = results[0].type == "socket";
            // hightlight the socket if a wire is being moved or a socket is to be selected for wiring
			if((issocket && (VisualEditor.currentMoving || VisualEditor.currentSingleType == "patch")))
			{
				VisualEditor.currentHightlight = results;
			}
			else
			{
                // check for wires under the mouse
				results = results.filter((item)=>item.selectionOrder == 4 );
				let iswire = false;
				if(results.length>0)
				{
					iswire = results[0].type == "patch";
				}
                // if currently not moving a wire, allow the wires to be highlighted
				if(!VisualEditor.currentMoving && iswire)
				{
					VisualEditor.currentHightlight = results;
				}
			}

		}
		
		VisualEditor.redrawSelection();
        // refresh mouse attached items
		if(VisualEditor.currentMoving)
		{
			VisualEditor.currentMoving.updatePosition();
		}
	}
    /**
     * Handles mouse clicks in default mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     * @param {boolean} dbl - true if double click
     */
	static handlePointerMode(x, y, dbl)
	{
		let results = VisualEditor.getMouseHits(x, y, true);
		// if empty space is clicked without Ctrl, clear selection, refresh and exit
		if(results.length < 1)
		{
			if(!VisualEditor.ctrl)
			{
				//console.log("before clear", VisualEditor.currentSelection);
				VisualEditor.currentSelection.clear();
				//console.log("after clear", VisualEditor.currentSelection);
			}
				
			VisualEditor.redrawSelection()
			return;
		}
        // if doubleclicking on a selected wire, highlight all wires in the same line
		if(dbl && results[VisualEditor.currentDepth]?.type == "patch")
		{
			VisualEditor.currentSelection.set(results[VisualEditor.currentDepth].parent.subItems);
			// refresh, exit
			VisualEditor.redrawSelection();
			return;
		}
        // cycle the counter to select the next item under the mouse
        // #BUG: messes with the doubleclicking behaviour, as the first click of the double click
        // advances the counter once, and the second click actually fires the double click event
		VisualEditor.currentDepth++;
		if(VisualEditor.currentDepth >= results.length)
		{
			VisualEditor.currentDepth = 0;
		}
        // if Ctrl is down, add currently picked item to selection
		if(VisualEditor.ctrl)
		{
			VisualEditor.currentSelection.add([results[VisualEditor.currentDepth]])
		}
        // else just select the one item
		else
		{
			VisualEditor.currentSelection.set([results[VisualEditor.currentDepth]])
		}
		VisualEditor.redrawSelection();
	}
    /**
     * Handles mouse downs in default mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     */
	static handleMDownPointerMode(x, y)
	{
        // if hovering a location, start moving it
        // #TODO: maybe only do this if it is selected first?
		if(VisualEditor.currentHightlight[0]?.type == "location")
		{
			console.log("picked up", VisualEditor.currentHightlight[0]);
			VisualEditor.currentMoving = VisualEditor.currentHightlight[0];
            // set offsets so it aligns with where exactly the mouse grabbed it
			VisualEditor.currentMovingX = VisualEditor.currentMoving.x - x;
			VisualEditor.currentMovingY = VisualEditor.currentMoving.y - y;
		}
		VisualEditor.updateCursor();
	}
    /**
     * Handles mouse ups in default mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     */
	static handleMUpPointerMode(x, y)
	{
        // drop the moved object
		VisualEditor.currentMoving = null;
	}
    /**
     * Handles mouse moving in default mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     */
	static handleMMovePointerMode(x, y)
	{
		let results = VisualEditor.getMouseHits(x, y, true);
		// highlight everything the mouse touches
        VisualEditor.currentHightlight = results;
		VisualEditor.redrawSelection();
        VisualEditor.updateCursor();
		// remnants from ages ago
        // #TODO: remove
        let currentlabel = "";
		let currentrect = [];
		window.fiber.current = currentlabel;
	    window.fiber.selection = currentrect;
	}

	static handleLinkMode(x,y,dbl)
	{
		let results = VisualEditor.getMouseHits(x, y, true);
		if(results.length < 1)
		{
			return;
		}
		let item = results[0];
		if(item.type != "socket")
		{
			return;
		}
		// check if the target socket is empty
		if(VisualEditor.subMode == VisualEditor.SUB_MODES.LINK_END)
		{
			if( results[0].connections.length >0)
			{
				return
			}
			let newlink =VisualEditor.currentMoving.connections[0]
			results[0].takeFrom(VisualEditor.currentMoving, newlink);
			// reset state 
			VisualEditor.currentMoving = null;
			VisualEditor.currentSelection.clear();
			VisualEditor.refreshView();
			VisualEditor.subMode = VisualEditor.SUB_MODES.NONE;
			return;

		}
		if(results[0].connections.length <1)
		{
			
            // make a fake socket to attach the wire to
			let mSocket = new VisualSocket(VisualEditor.fixedMap, "mousemove");
			// temp patch to make the fake socket match the mouse exactly
			VisualEditor.currentMovingX=-1*(DIM_FRAME_SIDES + 5);
			VisualEditor.currentMovingY=-2;
			// create a wire, attach it from the target socket to the fake socket
			let newpatch = new VisualPatch(VisualEditor.lineMap.looseLinks, VisualEditor.lineMap.getNextSlot());
			newpatch.from = results[0];
			results[0].connect(newpatch);
			newpatch.to = mSocket;
			mSocket.connect(newpatch);
			VisualEditor.lineMap.looseLinks.subItems.push(newpatch);
			VisualEditor.reportUpdate(VisualEditor.lineMap.looseLinks);
			VisualEditor.subMode = this.SUB_MODES.LINK_END;
		
			// attach the fake socket to the mouse
			VisualEditor.currentMoving = mSocket;
			// refresh
			VisualEditor.redrawSelection();
			return;
		}
		else if(results[0].connections.length == 1 && results[0].connections[0].parent == VisualEditor.lineMap.looseLinks)
		{ // make a fake socket to attach the wire to
			let mSocket = new VisualSocket(VisualEditor.fixedMap, "mousemove");
			// temp patch to make the fake socket match the mouse exactly
			VisualEditor.currentMovingX=-1*(DIM_FRAME_SIDES + 5);
			VisualEditor.currentMovingY=-2;
            

			mSocket.takeFrom(results[0], results[0].connections[0]);
			VisualEditor.subMode = this.SUB_MODES.LINK_END;
			// attach the fake socket to the mouse
			VisualEditor.currentMoving = mSocket;
			// refresh
			VisualEditor.redrawSelection();
			return;
			
		}
	}
    /**
     * Handles mouse up events in wiring mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     * @returns 
     */
	static handleMUpLinkMode(x, y)
	{

	}
    /**
     * Handles mouse downs in wiring mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     */
	static handleMDownLinkMode(x, y)
	{

	}
    /**
     * Handles mouse moving in wiring mode.
     * @param {Number} x - x coordinate of mouse
     * @param {Number} y - y coordinate of mouse
     */
	static handleMMoveLinkMode(x, y)
	{
		VisualEditor.currentHightlight = [];
		let results = VisualEditor.getMouseHits(x, y, true);
        // see if any sockets are under the mouse
		results = results.filter((item)=>item.selectionOrder == 5);
		if(results && results.length>0)
		{
			VisualEditor.currentHightlight = results;
		}
		
		VisualEditor.redrawSelection();
        // refresh mouse attached items
		if(VisualEditor.currentMoving)
		{
			VisualEditor.currentMoving.updatePosition();
		}
	}
}

