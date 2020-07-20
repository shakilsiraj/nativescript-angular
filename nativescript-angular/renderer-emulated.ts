import { Inject, Injectable, RendererFactory2, Optional, NgZone, RendererType2 } from "@angular/core";
import { View, getViewById, IDevice, Application, profile } from '@nativescript/core';
import { APP_ROOT_VIEW, DEVICE, getRootPage } from './platform-providers';
import { ViewUtil } from './view-util';
import { NgView, InvisibleNode } from './element-registry';
import { NativeScriptDebug } from './trace';
import { NativeScriptRenderer } from './renderer';

// CONTENT_ATTR not exported from NativeScript_renderer - we need it for styles application.
const COMPONENT_REGEX = /%COMP%/g;
const ATTR_SANITIZER = /-/g;
export const COMPONENT_VARIABLE = '%COMP%';
export const HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
export const CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;

const replaceNgAttribute = function(input: string, componentId: string): string {
	return input.replace(COMPONENT_REGEX, componentId);
}

const addScopedStyleToCss = profile(`"renderer".addScopedStyleToCss`, function addScopedStyleToCss(style: string): void {
	Application.addCss(style, true);
});

@Injectable()
export class EmulatedRenderer extends NativeScriptRenderer {
	private contentAttr: string;
	private hostAttr: string;

	constructor(component: RendererType2, rootView: NgView, zone: NgZone, viewUtil: ViewUtil) {
		super(rootView, zone, viewUtil);

		const componentId = component.id.replace(ATTR_SANITIZER, '_');
		this.contentAttr = replaceNgAttribute(CONTENT_ATTR, componentId);
		this.hostAttr = replaceNgAttribute(HOST_ATTR, componentId);
		this.addStyles(component.styles, componentId);
	}

	applyToHost(view: NgView) {
		super.setAttribute(view, this.hostAttr, '');
	}

	appendChild(parent: any, newChild: NgView): void {
		super.appendChild(parent, newChild);
	}

	createElement(parent: any, name: string): NgView {
		const view = super.createElement(parent, name);

		// Set an attribute to the view to scope component-specific css.
		// The property name is pre-generated by Angular.
		super.setAttribute(view, this.contentAttr, '');

		return view;
	}

	@profile
	private addStyles(styles: (string | any[])[], componentId: string) {
		styles
			.map((s) => s.toString())
			.map((s) => replaceNgAttribute(s, componentId))
			.forEach(addScopedStyleToCss);
	}
}