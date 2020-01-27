import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Instance } from 'simple-peer';
import { PeerData, UserInfo } from 'src/models/peerData.interface';

declare var SimplePeer: any;

@Injectable({
  providedIn: 'root'
})
export class RtcService {

  private users: BehaviorSubject<Array<UserInfo>>;
  public users$: Observable<Array<UserInfo>>;

  private onSignalToSend = new Subject<PeerData>();
  public onSignalToSend$ = this.onSignalToSend.asObservable();

  private onStream = new Subject<PeerData>();
  public onStream$ = this.onStream.asObservable();

  private onConnect = new Subject<PeerData>();
  public onConnect$ = this.onConnect.asObservable();

  private onData = new Subject<PeerData>();
  public onData$ = this.onData.asObservable();

  public currentPeer: Instance;

  constructor() {
    this.users = new BehaviorSubject([]);
    this.users$ = this.users.asObservable();
  }

  public newUser(user: UserInfo): void {
    this.users.next([...this.users.getValue(), user]);
  }

  public disconnectedUser(user: UserInfo): void {
    const filteredUsers = this.users.getValue().filter(x => x.connectionId === user.connectionId);
    this.users.next(filteredUsers);
  }

  public createPeer(stream, userId: string, initiator: boolean): Instance {
    const peer = new SimplePeer({ initiator, stream });

    peer.on('signal', data => {
      const stringData = JSON.stringify(data);
      this.onSignalToSend.next({ id: userId, data: stringData });
    });

    peer.on('stream', data => {
      console.log('on stream', data);
      this.onStream.next({ id: userId, data });
    });

    peer.on('connect', () => {
      this.onConnect.next({ id: userId, data: null });
    });

    peer.on('data', data => {
      this.onData.next({ id: userId, data });
    });

    return peer;
  }

  public signalPeer(userId: string, signal: string, stream: any) {
    const signalObject = JSON.parse(signal);
    if (this.currentPeer) {
      this.currentPeer.signal(signalObject);
    } else {
      this.currentPeer = this.createPeer(stream, userId, false);
      this.currentPeer.signal(signalObject);
    }
  }

  public sendMessage(message: string) {
    this.currentPeer.send(message);
  }

}
