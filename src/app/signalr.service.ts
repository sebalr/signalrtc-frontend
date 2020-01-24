import { Injectable } from '@angular/core';
import * as signalR from "@aspnet/signalr";
import { Subject, zip } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection: signalR.HubConnection;

  private newPeer = new Subject<UserInfo>();
  public newPeer$ = this.newPeer.asObservable();

  private helloAnswer = new Subject<UserInfo>();
  public helloAnswer$ = this.helloAnswer.asObservable();

  private disconnectedPeer = new Subject<UserInfo>();
  public disconnectedPeer$ = this.disconnectedPeer.asObservable();

  private signal = new Subject<any>();
  private user = new Subject<string>();
  public signal$ = zip(this.signal, this.user);

  constructor() { }

  public async startConnection(currentUser: string): Promise<void> {

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5001/signalrtc')
      .build();

    await this.hubConnection.start();
    console.log('Connection started');

    this.hubConnection.on('NewUser', (data) => {
      this.newPeer.next(JSON.parse(data));
    });

    this.hubConnection.on('HelloUser', (data) => {
      this.helloAnswer.next(JSON.parse(data));
    });

    this.hubConnection.on('UserDisconnect', (data) => {
      this.disconnectedPeer.next(JSON.parse(data));
    });

    this.hubConnection.on('SendSignal', (signal, user) => {
      this.signal.next(signal);
      this.user.next(user);
    });

    this.hubConnection.invoke('NewUser', currentUser);
  }

  public sendSignalToUser(signal: string, user: string) {
    this.hubConnection.invoke('SendSignal', signal, user);
  }

  public sayHello(userName: string, user: string): void {
    this.hubConnection.invoke('HelloUser', userName, user);
  }

}
