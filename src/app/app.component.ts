import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RtcService } from './rtc.service';
import { Subscription } from 'rxjs';
import { SignalrService } from './signalr.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('videoPlayer', { static: false }) videoPlayer: ElementRef;

  public subscriptions = new Subscription();

  private stream;

  public currentUser: string;

  public dataString: string;

  public userVideo: string;

  public mediaError = (): void => { console.error(`Can't get user media`); };

  constructor(private rtcService: RtcService, private signalR: SignalrService) { }

  ngOnInit() {
    this.subscriptions.add(this.signalR.newPeer$.subscribe((user: UserInfo) => {
      console.log('New peer join', user, new Date());
      this.rtcService.newUser(user);
      this.signalR.sayHello(this.currentUser, user.connectionId);
    }));

    this.subscriptions.add(this.signalR.helloAnswer$.subscribe((user: UserInfo) => {
      console.log('User say hello', user, new Date());
      this.rtcService.newUser(user);
    }));

    this.subscriptions.add(this.signalR.disconnectedPeer$.subscribe((user: UserInfo) => {
      console.log('peer disconnected', user);
      this.rtcService.disconnectedUser(user);
    }));

    this.subscriptions.add(this.signalR.signal$.subscribe(([user, signal]) => {
      console.log('Remote peer send us signal data', user, new Date());
      this.rtcService.signalPeer(user, signal, this.stream);
    }));

    this.subscriptions.add(this.rtcService.onSignalToSend$.subscribe((data: PeerData) => {
      console.log('Send signal to user', new Date(), data.id);
      this.signalR.sendSignalToUser(data.data, data.id);
    }));

    this.subscriptions.add(this.rtcService.onData$.subscribe((data: PeerData) => {
      console.log(`Data from user ${data.id}: ${data.data}`);
    }));

    this.subscriptions.add(this.rtcService.onStream$.subscribe((data: PeerData) => {
      this.userVideo = data.id;
      console.log(data.data);
      this.videoPlayer.nativeElement.srcObject = data.data;
      this.videoPlayer.nativeElement.load();
      this.videoPlayer.nativeElement.play();
    }));
  }


  public onUserSelected(userInfo: UserInfo) {
    console.log(this.stream);
    const peer = this.rtcService.createPeer(this.stream, userInfo.connectionId, true);
    this.rtcService.currentPeer = peer;
  }

  public async saveUsername(): Promise<void> {
    try {
      await this.signalR.startConnection(this.currentUser);
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log(this.stream);
    } catch (error) {
      console.error(`Can't join room, error ${error}`);
    }
  }

  public sendMessage() {
    this.rtcService.sendMessage(this.dataString);
    this.dataString = null;
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
