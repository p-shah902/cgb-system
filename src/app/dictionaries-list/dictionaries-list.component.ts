import { Component, inject, Inject, OnInit } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DictionaryService } from '../../service/dictionary.service';
import { DictionaryDetail,Item } from '../../models/dictionary';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dictionaries-list',
  standalone: true,
  imports: [NgbNavModule, NgbNavModule,CommonModule],
  templateUrl: './dictionaries-list.component.html',
  styleUrl: './dictionaries-list.component.scss'
})
export class DictionariesListComponent implements OnInit {
  active:string="top";

  private dictionaryService=inject(DictionaryService);
  private router=inject(Router);

  dictionaryItem:Item[]=[];
  dictionaryDetail:DictionaryDetail[]=[];

  ngOnInit(): void {
      this.loadDictionaryIteams();
      
  }

  loadDictionaryIteams(){

      this.dictionaryService.getDictionaryItemList().subscribe({
        next:(response)=>{
          if(response.status && response.data)
          {
            this.dictionaryItem=response.data;
            console.log('Dictionary Item',this.dictionaryItem);
            if(this.dictionaryItem.length>0)
            {
              const iteamName=this.dictionaryItem[0].itemName;
              this.loadDictionaryDetails(iteamName);
            }

          }
        },error:(error)=>{
          console.log('error',error);
        }
      })
  }

  loadDictionaryDetails(itemName:string){
    this.active=itemName;
    this.dictionaryService.getDictionaryListByItem(itemName).subscribe({
      next:(response)=>{
        if(response.status && response.data)
        {
          this.dictionaryDetail=response.data;
          console.log('Dictionary Detail',this.dictionaryDetail);

        }
      },error:(error)=>{
        console.log('error',error);
      }
    })

  }

  nevigate(){
    this.router.navigate(['/dictionaries-edit']);
  }
}
