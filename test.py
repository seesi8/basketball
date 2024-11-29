from bs4 import BeautifulSoup

# HTML content as a string (replace this with your actual HTML content)
html_content = """
<td class="dynasty d-none d-md-table-cell col"><span>#3</span> 
                              <br><span class="small text-muted"><i class="fa fa-arrows-h"></i> </span>
                          </td>
                          
                          <td class="dynasty d-none d-md-table-cell col-md-2">
                                                     Luka Doncic
                          <input type="hidden" name="ctl00$ContentPlaceHolder1$Repeater2$ctl02$HF1" id="ContentPlaceHolder1_Repeater2_HF1_2" value="15200">
                          <span class="small"><span class="icon-injured" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Player is currently injured" aria-label="Player is currently injured"><i class="fa fa-ambulance" aria-hidden="true"></i></span></span>  
                          </td>
                          <td class="dynasty d-block d-sm-none col">
                                <div style="padding: 2px;"></div>
                              <span class="badge bg-dark">#3</span> <i class="fa fa-arrows-h"></i>    
                              
                              <strong>Luka Doncic</strong> <span class="small"><span class="icon-injured" data-bs-toggle="tooltip" data-bs-placement="top" title="" data-bs-original-title="Player is currently injured" aria-label="Player is currently injured"><i class="fa fa-ambulance" aria-hidden="true"></i></span></span>
                              
                              <br> <span style="font-size: 0.8em;">(DAL, PG,SG)</span>  
                              <span style="font-size: 0.8em;">AGE: 25.7</span><br>
                          <input type="hidden" name="ctl00$ContentPlaceHolder1$Repeater2$ctl02$HF11" id="ContentPlaceHolder1_Repeater2_HF11_2" value="15200">

       <div style="padding: 5px;"></div>
       
       <span><kbd style="font-size: 0.8em;" class="avg">68 GP</kbd>    <kbd style="font-size: 0.8em;" class="bavg">0.462 FG%</kbd>        <kbd style="font-size: 0.8em;" class="avg">0.795 FT%</kbd>    <kbd style="font-size: 0.8em;" class="vgood">3.5 3PM</kbd>    <kbd style="font-size: 0.8em;" class="vgood">28.8 PTS</kbd> <kbd style="font-size: 0.8em;" class="good">7.8 REB</kbd> <kbd style="font-size: 0.8em;" class="elite">8.0 AST</kbd> <kbd style="font-size: 0.8em;" class="vgood">1.6 STL</kbd> <kbd style="font-size: 0.8em;" class="bavg">0.4 BLK</kbd> <kbd style="font-size: 0.8em;" class="ngood">3.6 TO</kbd></span>
                         

       <div style="padding: 5px;"></div>
      
                        Shot over 76% from the line for the first time in his career. Giving him a slight edge over Jokic due to age.
                    <div style="padding: 2px;"></div>
                          </td>
                          <td class="dynasty d-none d-md-table-cell col">25.7</td>
                          <td class="dynasty d-none d-md-table-cell col">DAL</td>
                          <td class="dynasty d-none d-md-table-cell col">PG,SG</td>
                          <td class="dynasty d-none d-md-table-cell col">
       <span><kbd style="font-size: 0.8em;" class="avg">68 GP</kbd>    <kbd style="font-size: 0.8em;" class="bavg">0.462 FG%</kbd>        <kbd style="font-size: 0.8em;" class="avg">0.795 FT%</kbd>    <kbd style="font-size: 0.8em;" class="vgood">3.5 3PM</kbd>    <kbd style="font-size: 0.8em;" class="vgood">28.8 PTS</kbd> <kbd style="font-size: 0.8em;" class="good">7.8 REB</kbd> <kbd style="font-size: 0.8em;" class="elite">8.0 AST</kbd> <kbd style="font-size: 0.8em;" class="vgood">1.6 STL</kbd> <kbd style="font-size: 0.8em;" class="bavg">0.4 BLK</kbd> <kbd style="font-size: 0.8em;" class="ngood">3.6 TO</kbd></span>
                         

       <div style="padding: 5px;"></div>
       
                              Shot over 76% from the line for the first time in his career. Giving him a slight edge over Jokic due to age.</td>
                      </tr>
"""

def parse(html_content):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, "html.parser")

    # Extract rank
    rank = soup.find("span").text.strip()

    # Extract name
    name = soup.find("td", class_="dynasty d-none d-md-table-cell col-md-2").text.strip().split('\n')[0]

    # Extract age
    def contains_tag(text):
        if text:
            try:
                text = text.text
                return True
            except Exception as e:
                return False
    
    age = soup.find_all("td", class_="dynasty d-none d-md-table-cell col", string=contains_tag)[0].text.strip()    

    # Extract team
    team = soup.find_all("td", class_="dynasty d-none d-md-table-cell col", string=contains_tag)[1].text.strip()    

    # Extract positions
    positions = soup.find_all("td", class_="dynasty d-none d-md-table-cell col", string=contains_tag)[2].text.strip()    

    # Extract performance metrics
    metrics = [kbd.text.strip() for kbd in soup.find_all("kbd")]

    # Organize extracted data into a dictionary
    player_data = {
        "Rank": rank,
        "Name": name,
        "Age": age,
        "Team": team,
        "Positions": positions,
        "Metrics": metrics,
    }
    
    return player_data

print(parse(html_content))
