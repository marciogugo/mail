document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#sendMail').addEventListener('click', send_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';
  
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';
  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch('emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {

    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';
  
    const att = document.createAttribute('id');
    att.value = 'table_'+mailbox;

    const emailTable = document.createElement('table');
    emailTable.setAttributeNode(att);

    if (mailbox == 'sent') {
      emailTable.innerHTML = `<tr><th style="width:30%">To</th><th style="width:50%">Subject</th><th style="width:20%">Date</th></tr>`;
    } else {
      emailTable.innerHTML = `<tr><th style="width:30%">From</th><th style="width:50%">Subject</th><th style="width:20%">Date</th></tr>`;
    }

    document.querySelector('#emails-view').append(emailTable);

    emails.forEach(element => {
      const e_mail = document.createElement('tr');
      const att2 = document.createAttribute('id');

      att2.value = `${element.id}`;

      if (mailbox != 'sent') {
        const itemProp = document.createAttribute('itemProp');
        itemProp.value = `${element.read}`;
        e_mail.setAttributeNode(itemProp);
      }

      e_mail.setAttributeNode(att2);

      if (mailbox != 'sent') {
        e_mail.innerHTML = `<td>${element.sender}</td>
                            <td>${element.subject}</td>
                            <td>${element.timestamp}</td>`;
      } else {
        e_mail.innerHTML = `<td>${element.recipients[0]}</td>
                            <td>${element.subject}</td>
                            <td>${element.timestamp}</td>`;
      }
                          
      e_mail.addEventListener('click', function() {
            get_mail(mailbox, this.id);
      });

      document.getElementById('table_'+mailbox).append(e_mail);
    });
  })

}

function send_mail() { 
    
  // Submit email and show sent mailbox
  document.querySelector('form').onsubmit = function (){
    const mail_recipients = document.querySelector('#compose-recipients').value;
    const mail_subject = document.querySelector('#compose-subject').value;
    const mail_body = document.querySelector('#compose-body').value;

    if (mail_recipients !== undefined & mail_recipients !== '') {
      if (mail_subject !== undefined & mail_subject !== '') {
        if (mail_body !== undefined & mail_body !== '') {
          fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: mail_recipients,
                subject: mail_subject,
                body: mail_body
            })
          })
          .then(response => response.json())
          .then(result => {
              load_mailbox('sent')
          });
        } else {
          alert('Please, inform the body of the email!')
        }
      } else {
        alert('Please, inform the subject of the email!')
      }
    } else {
      alert('Please, inform the recipient of the email!')
    }

    return false;
  }
}

function get_mail(mailbox, id){

  // Local variables
  let bool = false;

  // Show read view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'block';

  // Clear out read fields
  document.querySelector('#read-recipients').value = '';
  document.querySelector('#read-subject').value = '';
  document.querySelector('#read-body').value = '';

  fetch('/emails/'+id)
    .then(response => response.json())
    .then(email => {

      document.querySelector('#read-timestamp').value = email.timestamp;
      document.querySelector('#read-recipients').value = email.recipients;
      document.querySelector('#read-sender').value = email.sender;
      document.querySelector('#read-subject').value = email.subject;
      document.querySelector('#read-body').value = email.body;

      // Reply form
      const page = document.querySelector('#reply-view')
      page.innerHTML = '<button id="replyMail" class="btn btn-primary">Reply</button><span>   </span>'+
                       '<button id="archiveMail" type="submit" class="btn btn-primary">Archive</button>'
      document.querySelector('#replyMail').addEventListener('click', function(event){
        event.preventDefault();
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        if(email.subject.slice(0,2) !== 'Re'){
          document.querySelector('#compose-subject').value = 'Re: ' + `${email.subject}`;
        }else{
          document.querySelector('#compose-subject').value = `${email.subject}`;
        }
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: "${email.body.slice(0,250)}..."\n\n`
      })  

      document.querySelector('#archiveMail').addEventListener('click', function() {
        archive_mail(id, bool)
      });

      if (mailbox == 'sent') {
        document.querySelector('#archiveMail').style.display = 'none'
        document.querySelector('#replyMail').style.display = 'none'
      } else { 
        if (mailbox == 'archived') {
          document.querySelector('#replyMail').style.display = 'none'
        } else {
          document.querySelector('#archiveMail').style.display = 'true'
        }
    
        if (mailbox == 'inbox') {
          document.querySelector('#archiveMail').innerHTML = 'Archive'
          bool = true
        } else {
          document.querySelector('#archiveMail').innerHTML = 'Unarchive'
          bool = false
        }
      }
    
  });

  //Mark email as read
  if (mailbox == 'inbox') {
    fetch('/emails/'+id, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
    .then({});
  }

}

function archive_mail(id, bool) {

  fetch('/emails/'+id, {
    method: 'PUT',
    body: JSON.stringify({
      archived: bool
    })
  })
  .then(result => {});

}
