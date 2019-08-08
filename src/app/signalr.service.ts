import { Injectable } from '@angular/core';
import * as signalR from "@aspnet/signalr";
import { Subject, zip } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection: signalR.HubConnection;

  private newPeer = new Subject<any>();
  public newPeer$ = this.newPeer.asObservable();

  private signal = new Subject<any>();
  private user = new Subject<string>();
  public signal$ = zip(this.signal, this.user);

  constructor() { }

  public async startConnection(): Promise<void> {

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5001/signalrtc')
      .build();

    await this.hubConnection.start();
    console.log('Connection started');

    this.hubConnection.on('NewPeer', (data) => {
      this.newPeer.next(data);
    });

    this.hubConnection.on('SendSignal', (signal, user) => {
      console.log(user, signal);
      this.signal.next(signal);
      this.user.next(user);
    });
  }

  public joinGroup(group: string) {
    console.log('join', group);
    this.hubConnection.invoke('NewPeer', group);
  }

  public sendSignalToUser(signal: string, user: string) {
    console.log('invoke', signal);
    this.hubConnection.invoke('SendSignal', signal, user);
  }

}
