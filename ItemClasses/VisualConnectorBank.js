

/**
 * Represents a connector bank - a collection of connectors
 */
class VisualConnectorBank extends VisualItem {
	elements = [];
	constructor(parent, name)
	{
		super("socket_bank",name, parent);
	}
}

class VisualBankPlacement extends VisualItem {
	ref="";
	constructor(parent,name)
	{
		super("bank",name,parent);
	}
}