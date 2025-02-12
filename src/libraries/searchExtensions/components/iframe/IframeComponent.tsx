/* eslint-disable @microsoft/spfx/pair-react-dom-render-unmount */
import * as React from 'react';
import { BaseWebComponent } from '@pnp/modern-search-extensibility';
import * as ReactDOM from 'react-dom';
import { Log } from "@microsoft/sp-core-library";
import Iframe from 'react-iframe';
import { IIframe } from 'react-iframe/types';

const ModalComponent_LogSource = "PnPSearch:IFrameComponent";


export class IFrameWebComponent extends BaseWebComponent {
   public constructor() {
           super();
           
       }
   
       public async connectedCallback():Promise<void> {
           console.log(`${ModalComponent_LogSource} - Connected Callback `);
           try {
          
   
           const rawProps = this.resolveAttributes();
           const props: IIframe = {
               url: rawProps.url,
               ...rawProps
           };
           if(props.url) {
           const modalComponent = <Iframe {...props} />;
           
           ReactDOM.render(modalComponent, this);
           }
           else {
                ReactDOM.render(<div>No URL provided - please specify data-url parameter</div>, this);
           }   
        }
           catch(err) {
               Log.error(ModalComponent_LogSource, err);
               ReactDOM.render(<div>Error</div>, this);
           }
       }
   
       protected onDispose(): void {
           ReactDOM.unmountComponentAtNode(this);
       }

}