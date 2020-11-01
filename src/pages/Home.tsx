import { IonButton, IonContent, IonHeader, IonItem, IonList, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/react';
import { Plugins } from '@capacitor/core';
import React, { Component } from 'react';
import './Home.css';
import 'capacitor-cidprint';
import { Device, ListenerTypes, PrinterActionType, PrinterEvent, PrinterEventType, PrinterStatusType } from 'capacitor-cidprint';
import { useLocation } from 'react-router';

const { CIDPrint } = Plugins;

export class Home extends Component {
  state = {
    enabled: false,
    connected: false,
    devname: '',
    devmac: '',
    devices: Array<Device>(),
    status: ''
  }
  constructor(props: any) {
    super(props);
    this.state = { enabled: false, connected: false, devname: '', devmac: '', devices: [], status:  '' };
  }

  discoverListener = Plugins.CIDPrint.addListener(ListenerTypes.DISCOVER, (result: any) => {
    let data: PrinterEvent = result.result[0];
    if(data.action === PrinterActionType.LIST_PRINTER) {
      this.setState({ devmac: data.device.devicemac, devname: data.device.devicename });
    } else if(data.action === PrinterActionType.LIST_PRINTERS) {
      this.setState({ devices: data.devices });
    }
  });

  printListener = Plugins.CIDPrint.addListener(ListenerTypes.PRINT, (result: any) => {
    let data: PrinterEvent = result.result[0];
    console.log("printer event");
    console.log(data);
    if(data.action === PrinterActionType.PRINT) {
      if(data.type === PrinterEventType.NOTIFY) {
        switch(data.status) {
          case PrinterStatusType.BATTERY_NOT_OK:
            this.setState({ status: 'Batterie schwach.' });
            break;
          case PrinterStatusType.COVER_OPEN:
            this.setState({ status: 'Bitte Deckel schließen' });
            break;
          case PrinterStatusType.OK_STILL_PRINTING:
            this.setState({ status: 'Drucken noch nicht abgeschlossen.' });
            break;
          case PrinterStatusType.OK_WAITING_TO_DISPENSE:
            this.setState({ status: 'Bitte Etikett abnehmen' });
            break;
          case PrinterStatusType.PAPER_OUT:
            this.setState({ status: 'Bitte Papier einlegen.' });
            break;
        }
      }
    }
  });

  async init() {
    await CIDPrint.initCIDPrinterLib();
  }

  async enableBluetooth() {
    this.setState({ enabled: await CIDPrint.enableBluetoothPrinting({enable: true})})
  }

  discover() {
    CIDPrint.discoverDevices();
  }

  async connect(printer: Device) {
    this.setState({connected: await CIDPrint.connectToPreferredPrinter({mac: printer.devicemac })})
  }

  async print(label: string, data: string[]) {
    this.setState({ status: 'printing Label' });
    await CIDPrint.printLabelWithData({label: label, data: data});
//    await CIDPrint.printLabel({label: 'label41.dat'})
  }

  render() {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Bluetooth Print</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonButton onClick={() => this.init()}>Initialize Plugin</IonButton>
          <IonButton onClick={() => this.enableBluetooth()}>Enable Bluetooth</IonButton>
          <IonButton disabled={!this.state.enabled} onClick={() => this.discover()}>Discover Bluetooth Printer</IonButton>
          <IonButton disabled={!this.state.connected} onClick={() => this.print('label1.dat', ['dies ist', '    ', ' wow', '1232345398726658566666', '1234    334/56    202011.33   111.12/123', ' EUR', '   12,34', '123     67/66    898', '4444', 'nif number/num'])}>Print Label</IonButton>
          <IonList>
             {this.state.devices.map((item) => (
              <IonItem onClick={() => this.connect(item)}><IonText>{ item.devicename } -- { item.devicemac }</IonText></IonItem>
            ))}
           </IonList>
             <IonText>{ this.state.status }</IonText>
         </IonContent>
      </IonPage>
    );
  }
}

export default Home;
