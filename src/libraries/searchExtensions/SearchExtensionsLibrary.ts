import { IAdaptiveCardAction, IComponentDefinition, IDataSourceDefinition, IExtensibilityLibrary, ILayoutDefinition, IQueryModifierDefinition, ISuggestionProviderDefinition } from "@pnp/modern-search-extensibility";
import { PopupWebComponent } from "./components/popup/PopupComponent";
import groupBy from './helpers/groupby';

export class SearchExtensionsLibrary implements IExtensibilityLibrary  {
  getCustomLayouts(): ILayoutDefinition[] {
    return [];
  }
  getCustomWebComponents(): IComponentDefinition<unknown>[] {
    return [
      {
        "componentName": "pnp-popup",
        "componentClass": PopupWebComponent
      }
    ];
  }
  getCustomSuggestionProviders(): ISuggestionProviderDefinition[] {
    return [];
  }
  registerHandlebarsCustomizations?(handlebarsNamespace: typeof Handlebars): void {
    groupBy(handlebarsNamespace);
  }
  invokeCardAction(action: IAdaptiveCardAction): void {
    return;
  }
  getCustomQueryModifiers?(): IQueryModifierDefinition[] {
    return [];
  }
  getCustomDataSources?(): IDataSourceDefinition[] {
    return [];
  }
  public name(): string {
    return 'SearchExtensionsLibrary';
  }
}
