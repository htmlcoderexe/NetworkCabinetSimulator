
/**
 * Represents a connector template
 */
class VisualConnectorTemplate extends VisualItem {
	renderer=null;
	commit(parser)
	{
		let renderer = this.find("renderer");
		this.renderer = renderer;
		this.removeItem(renderer);
		return true;
	}
	constructor(parent, name)
	{
		super("socket_tpl",name, parent);
	}
}

class VisualConnectorPlacement extends VisualItem {
	ref="";
	factoryLabel="";
	constructor(parent,name)
	{
		super("connector",name,parent);
	}
}

class VisualPortOptions extends VisualItem {
	counter =undefined;
	tpl=undefined;
	constructor(parent,name)
	{
		super("port_options",name,parent);
	}

}