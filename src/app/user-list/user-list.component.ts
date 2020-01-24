import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { SignalrService } from '../signalr.service';
import { RtcService } from '../rtc.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  @Output() userSelected: EventEmitter<UserInfo> = new EventEmitter();

  public users$: Observable<Array<UserInfo>>;


  constructor(private rtcService: RtcService) { }

  ngOnInit() {
    this.users$ = this.rtcService.users$;
  }

  public userClicked(user: UserInfo) {
    console.log(user);
    this.userSelected.emit(user);
  }

}
