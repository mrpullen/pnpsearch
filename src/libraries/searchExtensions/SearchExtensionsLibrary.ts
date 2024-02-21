import { IAdaptiveCardAction, IComponentDefinition, IDataSourceDefinition, IExtensibilityLibrary, ILayoutDefinition, IQueryModifierDefinition, ISuggestionProviderDefinition } from "@pnp/modern-search-extensibility";
import groupBy from './helpers/groupby';

export class SearchExtensionsLibrary implements IExtensibilityLibrary  {
  getCustomLayouts(): ILayoutDefinition[] {
    return [];
  }
  getCustomWebComponents(): IComponentDefinition<unknown>[] {
    return [];
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
