import { Component, OnDestroy, OnInit } from '@angular/core';
import { RtcService } from './rtc.service';
import { Subscription } from 'rxjs';
import { SignalrService } from './signalr.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  public subscriptions = new Subscription();

  public currentRoom: string;
  public initiator: boolean;
  private stream;

  public dataString: string;

  public mediaError = (): void => { console.error(`Can't get user media`); };

  constructor(private rtcService: RtcService, private signalR: SignalrService) { }

  ngOnInit() {
    this.subscriptions.add(this.signalR.newPeer$.subscribe((user) => {
      console.log('New peer join room', user);
      this.rtcService.createPeer(this.initiator, this.stream, user);
    }));

    this.subscriptions.add(this.signalR.signal$.subscribe(([signal, user]) => {
      console.log('Remote peer send us signal data', user, signal);
      this.rtcService.signalPeer(user, signal);
    }));

    this.subscriptions.add(this.rtcService.onSignal$.subscribe((data: PeerData) => {
      console.log('Send signal to user', data.data, data.id);
      this.signalR.sendSignalToUser(data.data, data.id);
    }));

    this.subscriptions.add(this.rtcService.onData$.subscribe((data: PeerData) => {
      console.log(`Data from user ${data.id}: ${data.data}`);
    }));
  }


  public async createRoom(): Promise<void> {
    await this.joinGroup(true);
  }

  public async joinRoom(): Promise<void> {
    await this.joinGroup(false);
  }

  public sendMessage() {
    this.rtcService.sendMessageToAll(this.dataString);
    this.dataString = null;
  }

  private async joinGroup(initiator: boolean) {
    try {
      await this.signalR.startConnection();
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.initiator = initiator;
      this.signalR.joinGroup(this.currentRoom);
    } catch (error) {
      console.error(`Can't join room, error ${error}`);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
