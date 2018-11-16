<?php
    $responses = array();
    
    $requests = json_decode(file_get_contents("php://input"));
    
    foreach ($requests as $request) {
        $response = new stdClass();
        $response->tid = $request->tid;
        $response->data = new stdClass();
        
        switch ($request->facadeFn) {
            
            case 'myFacade.myFunction':
                try {
                    $response->data->data = $request->data;
                    
                } catch (Exception $ex) {
                    $response->data->errorMsg = $ex->getMessage();
                }
                break;
            
            case 'color.load':
                try {
                    $rows = array();
                    
                    $rows[] = array('Bez'=>'rot', 'color'=>'#f00', 'iconChar'=>'&#xf111');
                    $rows[] = array('Bez'=>'grün', 'color'=>'#0f0', 'iconChar'=>'&#xf111');
                    $rows[] = array('Bez'=>'blau', 'color'=>'#00f', 'iconChar'=>'&#xf111');
                    $rows[] = array('Bez'=>'gelb', 'color'=>'#ff0', 'iconChar'=>'&#xf111');
                    $rows[] = array('Bez'=>'violett', 'color'=>'#f0f', 'iconChar'=>'&#xf111');
                    $rows[] = array('Bez'=>'hellblau', 'color'=>'#0ff', 'iconChar'=>'&#xf111');
                    $response->data->rows = $rows;

                    //sleep(1);
                    
                } catch (Exception $ex) {
                    $response->data->errorMsg = $ex->getMessage();
                }
                break;
            
            default:
                
        }
        
        $responses[] = $response;
    }
    
    print(json_encode($responses));
    
    