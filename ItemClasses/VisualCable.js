class VisualCable extends VisualItem
{
    from = null;
    to = null;
	constructor(map, name)	{
		super("cable", name, map);
		this.selectionOrder = 3;
	}
}