import * as React from 'react';
import { BaseWebComponent, IDataFilterInfo, ExtensibilityConstants } from '@pnp/modern-search-extensibility';
import * as ReactDOM from 'react-dom';
import { Modal, IModalProps, Text, ITheme,FontWeights, mergeStyleSets } from '@fluentui/react';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { Log } from "@microsoft/sp-core-library";
import * as DOMPurify from 'dompurify';
import { PnPClientStorage } from "@pnp/common/storage";

const ModalComponent_LogSource = "PnPSearch:PopUpComponent";

export interface IModalComponentProps {

    /**
     * If the modal is open by default
     */
    isOpen?: boolean;

    /**
     * This Modal is non-modal: even when it's open, it allows interacting with content outside the Modal.
     */
    isBlocking?: boolean;

    /**
     * This Modal uses "light dismiss" behavior: it can be closed by clicking or tapping the area outside the Modal (or using the close button as usual).
     */
    isLightDismiss?: boolean;

    /**
     * The Modal header text to display
     */
    ModalHeaderText?: string;

    /**
     * The content to render in the Modal
     */
    contentTemplate?: string;

    /**
     * The content to render to open the Modal
     */
    openTemplate?: string;

    /**
     * The current theme settings
     */
    themeVariant?: IReadonlyTheme;

    /**
     * The Modal component unique key for storage
     */
    stateKey?: string;

    /**
     * If specified, disabled the Modal transition animation
     */
    disableAnimation?: boolean;
}

export interface IModalState {

    /**
     * Flag indicating if we should show the Modal
     */
    showModal?: boolean;
}


export class ModalComponent extends React.Component<IModalComponentProps, IModalState> {

    /**
     * The client storage instance
     */
    private clientStorage: PnPClientStorage;
    private ModalComponentUniqueKey: string = "PnPSearch:PopUpComponent";

    constructor(props: IModalComponentProps) {
        super(props);

        this.state = {
            showModal: this.props.isOpen
        };

        this._onCloseModal = this._onCloseModal.bind(this);
        this._onToggleModal = this._onToggleModal.bind(this);
        this._updateFilter = this._updateFilter.bind(this);
        this._applyAllFilters = this._applyAllFilters.bind(this);
        this._clearAllFilters = this._clearAllFilters.bind(this);
        this._updateFilterOperator = this._updateFilterOperator.bind(this);

        this.clientStorage = new PnPClientStorage();

        if (props.stateKey) {
            this.ModalComponentUniqueKey = `${this.ModalComponentUniqueKey}:${props.stateKey}`;
        }
    }

    public render(): JSX.Element {

        const modalProps: IModalProps = {
            theme: this.props.themeVariant as ITheme,
            isOpen: this.state.showModal,
            isBlocking: this.props.isBlocking,
            isModeless: false,
            onDismiss: this._onCloseModal,
            
        };
        const theme = this.props.themeVariant as ITheme;
        const contentStyles = mergeStyleSets({
            container: {
              display: 'flex',
              flexFlow: 'column nowrap',
              alignItems: 'stretch',
            },
            header: [
              theme.fonts.xLargePlus,
              {
                flex: '1 1 auto',
                borderTop: `4px solid ${theme.palette.themePrimary}`,
                color: theme.palette.neutralPrimary,
                display: 'flex',
                alignItems: 'center',
                fontWeight: FontWeights.semibold,
                padding: '12px 12px 14px 24px',
              },
            ],
            heading: {
              color: theme.palette.neutralPrimary,
              fontWeight: FontWeights.semibold,
              fontSize: 'inherit',
              margin: '0',
            },
            body: {
              flex: '4 4 auto',
              padding: '0 24px 24px 24px',
              overflowY: 'hidden',
              selectors: {
                p: { margin: '14px 0' },
                'p:first-child': { marginTop: 0 },
                'p:last-child': { marginBottom: 0 },
              },
            },
            
          });

        // Avoid Modal animation flickering when the control is re-rerendered after a filter is selected
        if (this.props.disableAnimation) {
            modalProps.styles = {
                main: {
                    transition: 'none',
                    animation: 'none'
                }
            };
        }

        return <div>
            <Text theme={this.props.themeVariant as ITheme}>
                <div
                    role="menu"
                    tabIndex={0}
                    onClick={this._onToggleModal}
                    onKeyPress={(e) => {
                        if (e.charCode === 13) {
                            this._onToggleModal();
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(this.props.openTemplate as string) }}>
                </div>
            </Text>
            <Modal {...modalProps}>
                <div className={contentStyles.header}>
                    {this.props.ModalHeaderText}
                </div>
                <div className={contentStyles.body} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(this.props.contentTemplate as string) }}>
                </div>
            </Modal>
            
        </div>;
    }

    public componentDidMount():void {

        if (this.props.isOpen !== undefined) {
            this.setState({ showModal: this.props.isOpen });
        } else {

            // Get expand state if any
            const isOpen = this.clientStorage.session.get(this.ModalComponentUniqueKey);

            if (isOpen !== null) {
                this.setState({ showModal: isOpen });
            }
        }

        // Reset the state when the page is refreshed or the window location is updated
        window.onbeforeunload = () => {
            this.clientStorage.session.delete(this.ModalComponentUniqueKey);
        };

        this._bindEvents();
    }

    public componentDidUpdate():void {
        this._bindEvents();
    }

    private _bindEvents():void {
        this.bindFilterEvents();
        this.bindApplyFiltersEvents();
        this.bindClearFiltersEvents();
        this.bindOperatorSelectionEvents();
    }

    private _onCloseModal():void {
        this.setState({ showModal: false });

        // Save the Modal open state
        this.clientStorage.session.put(this.ModalComponentUniqueKey, false);
    }

    private _onToggleModal():void {
        this.setState({ showModal: !this.state.showModal });

        // Save the Modal open state
        this.clientStorage.session.put(this.ModalComponentUniqueKey, !this.state.showModal);
    }

    /**
     * Binds event fired from pagination web components
     */
    private bindFilterEvents():void {

        if (this.state.showModal) {
            // Catch Modal event
            // Because the Modal is outside the component DOM elemnt itself, we need to catch the event at document level
            document.addEventListener(ExtensibilityConstants.EVENT_FILTER_UPDATED, this._updateFilter);
        } else {
            document.removeEventListener(ExtensibilityConstants.EVENT_FILTER_UPDATED, this._updateFilter);
        }
    }

    /**
     * Binds event fired from filter value web components ('When all filter values are applied (multi values filter)')
     */
    private bindApplyFiltersEvents():void {

        if (this.state.showModal) {
            document.addEventListener(ExtensibilityConstants.EVENT_FILTER_APPLY_ALL, this._applyAllFilters);
        } else {
            document.removeEventListener(ExtensibilityConstants.EVENT_FILTER_APPLY_ALL, this._applyAllFilters);
        }
    }

    /**
     * Binds event fired from filter value web components ('When all filter values are cleared (multi values filter)')
     */
    private bindClearFiltersEvents():void {

        if (this.state.showModal) {
            document.addEventListener(ExtensibilityConstants.EVENT_FILTER_CLEAR_ALL, this._clearAllFilters);
        } else {
            document.removeEventListener(ExtensibilityConstants.EVENT_FILTER_CLEAR_ALL, this._clearAllFilters);
        }
    }

    /**
     * Binds event fired from filter value web components ('When the operator between filter values changes')
     */
    private bindOperatorSelectionEvents():void {
        if (this.state.showModal) {
            document.addEventListener(ExtensibilityConstants.EVENT_FILTER_VALUE_OPERATOR_UPDATED, this._updateFilterOperator);
        } else {
            document.removeEventListener(ExtensibilityConstants.EVENT_FILTER_VALUE_OPERATOR_UPDATED, this._updateFilterOperator);
        }
    }

    private _applyAllFilters(ev: CustomEvent):void {

        ev.stopImmediatePropagation();

        // Get the Web Part instance ID from where the event was fired so we can fire again this event but scoped to the Web Part
        const webPartInstanceId = ev.detail.instanceId;
        const webPartDomElement = window.document.querySelector(`div[data-instance-id="${webPartInstanceId}"]`);

        if (webPartDomElement) {
            webPartDomElement.dispatchEvent(new CustomEvent(ExtensibilityConstants.EVENT_FILTER_APPLY_ALL, {
                detail: {
                    filterName: ev.detail.filterName,
                },
                bubbles: true,
                cancelable: true
            }));
        } else {
            Log.info(ModalComponent_LogSource, `Unable to find the data filter WP. Did you forget to add the 'instance-id' attribute to the 'pnp-filter-multi' component?`);
        }

    }

    private _clearAllFilters(ev: CustomEvent):void {

        ev.stopImmediatePropagation();

        // Get the Web Part instance ID from where the event was fired so we can fire again this event but scoped to the Web Part
        const webPartInstanceId = ev.detail.instanceId;
        const webPartDomElement = window.document.querySelector(`div[data-instance-id="${webPartInstanceId}"]`);

        if (webPartDomElement) {

            webPartDomElement.dispatchEvent(new CustomEvent(ExtensibilityConstants.EVENT_FILTER_CLEAR_ALL, {
                detail: {
                    filterName: ev.detail.filterName,
                },
                bubbles: true,
                cancelable: true
            }));
        } else {
            Log.info(ModalComponent_LogSource, `Unable to find the data filter WP. Did you forget to add the 'instance-id' attribute to the 'pnp-filter-multi' component?`);
        }
    }

    private _updateFilter(ev: CustomEvent):void {

        ev.stopImmediatePropagation();

        // Get the Web Part instance ID from where the event was fired so we can fire again this event but scoped to the Web Part
        // 'data-instance-id' is a custom managed attribute to uniquely identify the filter Web Part when the Modal belongs to
        const webPartInstanceId = ev.detail.instanceId;
        const webPartDomElement = window.document.querySelector(`div[data-instance-id="${webPartInstanceId}"]`);

        const eventDetails = ev.detail as IDataFilterInfo;

        if (webPartDomElement) {

            webPartDomElement.dispatchEvent(new CustomEvent(ExtensibilityConstants.EVENT_FILTER_UPDATED, {
                detail: {
                    filterName: eventDetails.filterName,
                    filterValues: eventDetails.filterValues,
                    instanceId: eventDetails.instanceId,
                    forceUpdate: eventDetails.forceUpdate,
                    operator: eventDetails.operator
                } as IDataFilterInfo,
                bubbles: true,
                cancelable: true
            }));

        } else {
            Log.info(ModalComponent_LogSource, `Unable to find the data filter WP. Did you forget to add the 'instance-id' attribute to the 'pnp-filter-multi' component?`);
        }
    }

    private _updateFilterOperator(ev: CustomEvent):void {

        ev.stopImmediatePropagation();

        // Get the Web Part instance ID from where the event was fired so we can fire again this event but scoped to the Web Part
        const webPartInstanceId = ev.detail.instanceId;
        const webPartDomElement = window.document.querySelector(`div[data-instance-id="${webPartInstanceId}"]`);

        if (webPartDomElement) {
            webPartDomElement.dispatchEvent(new CustomEvent(ExtensibilityConstants.EVENT_FILTER_VALUE_OPERATOR_UPDATED, {
                detail: {
                    filterName: ev.detail.filterName,
                    operator: ev.detail.operator
                },
                bubbles: true,
                cancelable: true
            }));
        } else {
            Log.info(ModalComponent_LogSource, `Unable to find the data filter WP. Did you forget to add the 'instance-id' attribute to the 'pnp-filter-multi' component?`);
        }
    }
}

export class PopupWebComponent extends BaseWebComponent {

    public constructor() {
        super();
    }

    public async connectedCallback():Promise<void> {

        const domParser = new DOMParser();
        const htmlContent: Document = domParser.parseFromString(this.innerHTML, 'text/html');

        // Get the templates
        const openTemplate = htmlContent.getElementById('Modal-open');
        const contentTemplate = htmlContent.getElementById('Modal-content');

        let contentTemplateContent = null;
        let openTemplateContent = null;

        if (contentTemplate) {
            contentTemplateContent = contentTemplate.innerHTML;
        }

        if (openTemplate) {
            openTemplateContent = openTemplate.innerHTML;
        }

        const props = this.resolveAttributes();
        const fileIcon = <ModalComponent {...props} contentTemplate={contentTemplateContent as string} openTemplate={openTemplateContent as string} />;
        ReactDOM.render(fileIcon, this);
    }

    protected onDispose(): void {
        ReactDOM.unmountComponentAtNode(this);
    }
}