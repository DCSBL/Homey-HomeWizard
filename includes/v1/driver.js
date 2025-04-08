'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

module.exports = class HomeWizardEnergyDriver extends Homey.Driver {

  async onPair(session) {

    // First screen, get list of devices.
    session.setHandler('list_devices', async () => {

      const discoveryStrategy = this.getDiscoveryStrategy();
      const discoveryResults = discoveryStrategy.getDiscoveryResults();

      // Return list of devices, we do not test if device is reachable as we trust the discovery results
      const devices = [];
      for (const discoveryResult of Object.values(discoveryResults)) {

        devices.push({
          name: `${discoveryResult.txt.product_name} (${discoveryResult.txt.serial.substr(6)})`,
          data: {
            model: discoveryResult.txt.product_type,
            id: discoveryResult.txt.serial,
          },
          store: {
            address: discoveryResult.address,
            api_enabled: discoveryResult.txt.api_enabled == '1',
          },
        });
      }

      console.log('list_devices', devices);

      return devices;
    });

    // Undocumented event, triggered when the user selects a device
    // This is a list of one to many devices.
    session.setHandler('list_devices_selection', async (data) => {
      console.log('list_devices_selection', data);
      this.selectedDevices = data;
    });

    // Return the first device if which the API is not enabled, return null if all devices have the API enabled
    // We assume this.selectedDevices is set
    session.setHandler('get_device', async (data) => {

      console.log('get_device', this.selectedDevices);

      for (const device of this.selectedDevices) {
        if (!device.store.api_enabled) {
          console.log(`Device ${device.name} has API disabled`);
          await session.emit('show_device', this.selectedDevices);
        }
      }

      console.log('All devices with API enabled, returning null');
      return null;
    });

    session.setHandler('skip', async (selectedDevice) => {

      // Remove the selected devices from the list
      for (const device of this.selectedDevices) {
        if (device.data.id === selectedDevice.data.id) {
          console.log(`Removing device ${device.name} from list`);
          this.selectedDevices.splice(this.selectedDevices.indexOf(device), 1);
        }
      }

      return null;
    });
  }

  // async onPairListDevices() {

  //   const discoveryStrategy = this.getDiscoveryStrategy();
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   const discoveryResults = discoveryStrategy.getDiscoveryResults();
  //   const numberOfDiscoveryResults = Object.keys(discoveryResults).length;
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   const devices = [];
  //   await Promise.all(Object.values(discoveryResults).map(async (discoveryResult) => {
  //     try {
  //       const url = `http://${discoveryResult.address}:${discoveryResult.port}/api`;
  //       const res = await fetch(url);
  //       if (!res.ok)
  //       { throw new Error(res.statusText); }

  //       const data = await res.json();

  //       let name = data.product_name;
  //       if (numberOfDiscoveryResults > 1) {
  //         name = `${data.product_name} (${data.serial})`;
  //       }

  //       devices.push({
  //         name,
  //         data: {
  //           id: discoveryResult.id,
  //         },
  //       });
  //     } catch (err) {
  //       this.error(discoveryResult.id, err);
  //     }
  //   }));
  //   return devices;

  // }

};
